// src/components/FarmerDashboard.js
import React, { useState, useEffect } from 'react';
import './FarmerDashBoard.css';
const FarmerDashboard = () => {
  const [walletInfo, setWalletInfo] = useState({});
  const [produceData, setProduceData] = useState({ pricePerKg: '', quantity: '', temperature: '', humidity: '', freshness: '' });
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

  const handleSubmitProduce = async (e) => {
    e.preventDefault();
    setResponseMessage('');
    const payload = {
      farmerId: walletInfo.address,
      pricePerKg: Number(produceData.pricePerKg),
      quantity: Number(produceData.quantity),
      iotData: {
        temperature: Number(produceData.temperature),
        humidity: Number(produceData.humidity),
        freshness: Number(produceData.freshness)
      }
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

  return (
    <div className="dashboard-container">
      <h2>Farmer Dashboard</h2>
      <p>Your Wallet Address: {walletInfo.address}</p>
      <p>Balance: {walletInfo.balance}</p>
      <p>Staked Tokens: {walletInfo.staked}</p>
      
      <h3>Submit Produce Data</h3>
      <form onSubmit={handleSubmitProduce}>
        <input type="number" placeholder="Price per Kg" value={produceData.pricePerKg} onChange={(e) => setProduceData({...produceData, pricePerKg: e.target.value})} required />
        <input type="number" placeholder="Quantity" value={produceData.quantity} onChange={(e) => setProduceData({...produceData, quantity: e.target.value})} required />
        <input type="number" placeholder="Temperature" value={produceData.temperature} onChange={(e) => setProduceData({...produceData, temperature: e.target.value})} required />
        <input type="number" placeholder="Humidity" value={produceData.humidity} onChange={(e) => setProduceData({...produceData, humidity: e.target.value})} required />
        <input type="number" placeholder="Freshness" value={produceData.freshness} onChange={(e) => setProduceData({...produceData, freshness: e.target.value})} required />
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
