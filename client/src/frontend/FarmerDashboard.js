import React, { useState, useEffect } from 'react';
import './FarmerDashboard.css';
import WalletInfo from './Wallet';

const FarmerDashboard = () => {
  const [walletInfo, setWalletInfo] = useState({});
  const [produceData, setProduceData] = useState({ pricePerKg: '', quantity: '' });
  const [csvFile, setCsvFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [transactionPool, setTransactionPool] = useState([]);

  useEffect(() => {
    // Fetch wallet info on mount
    fetch(`${document.location.origin}/api/wallet-info`)
      .then(res => res.json())
      .then(data => setWalletInfo(data));

    // Poll transaction pool every 5 seconds
    const interval = setInterval(() => {
      fetch(`${document.location.origin}/api/transaction-pool-map`)
        .then(res => res.json())
        .then(data => setTransactionPool(Object.values(data)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleSubmitProduce = async (e) => {
    e.preventDefault();
    setResponseMessage('');

    if (!csvFile) {
      setResponseMessage('Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const jsonData = csvToJson(text);
      console.log(jsonData);
      const payload = {
        farmerId: walletInfo.address,
        pricePerKg: Number(produceData.pricePerKg),
        quantity: Number(produceData.quantity),
        iotData: jsonData
      };

      try {
        const res = await fetch(`${document.location.origin}/api/submit-produce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setResponseMessage('Produce submitted successfully!');
        console.log('Submission response:', data);
      } catch (err) {
        setResponseMessage('Failed to submit produce: ' + err.message);
      }
    };
    reader.readAsText(csvFile);
  };

  const csvToJson = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const rows = lines.slice(1);

    const jsonData = rows.map(row => {
      const values = row.split(',').map(value => value.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {});
    });

    return jsonData;
  };

  return (
    <div className="dashboard-container">
      <h2>Farmer Dashboard</h2>
      <WalletInfo
        address={walletInfo.address}
        balance={walletInfo.balance}
        staked={walletInfo.staked}
      />

      <h3>Submit Produce Data</h3>
      <form onSubmit={handleSubmitProduce}>
        <input
          type="number"
          placeholder="Price per Kg"
          value={produceData.pricePerKg}
          onChange={(e) => setProduceData({ ...produceData, pricePerKg: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={produceData.quantity}
          onChange={(e) => setProduceData({ ...produceData, quantity: e.target.value })}
          required
        />
     <div className="csv-upload-section">
  <p>Upload CSV IOT file :</p>
  {/* Associate the label with the hidden file input via htmlFor and id */}
  <label htmlFor="csvInput">Choose CSV File</label>
  <input 
    id="csvInput" 
    type="file" 
    accept=".csv" 
    onChange={handleFileChange} 
  />
</div>


        <button type="submit">Submit Produce</button>
      </form>

      {responseMessage && <p>{responseMessage}</p>}

      <h3>Pending Transactions</h3>
      {transactionPool.length === 0 ? (
        <p>No pending transactions.</p>
      ) : (
        <ul>
          {transactionPool.map(tx => (
            <li key={tx.id}>
              Transaction ID: {tx.id} | Quality Score: {tx.qualityScore} | Decision: {tx.qualityDecision}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FarmerDashboard;
