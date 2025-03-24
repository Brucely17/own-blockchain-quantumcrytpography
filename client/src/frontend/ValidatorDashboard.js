// src/components/ValidatorDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import './Dashboard.css'; // Adjust if you have a separate CSS file for dashboards
import './ValidatorDashBoard.css';

const ValidatorDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [sampleData, setSampleData] = useState({ temperature: '', humidity: '', freshness: '' });
  const [responseMessage, setResponseMessage] = useState('');
  const [validatorAddress, setValidatorAddress] = useState('');

  // Fetch wallet info on mount to get validatorAddress
  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const res = await fetch(`${document.location.origin}/api/wallet-info`);
        const data = await res.json();
        setValidatorAddress(data.address);
      } catch (err) {
        console.error("Error fetching wallet info:", err);
      }
    };
    fetchWalletInfo();
  }, []);

  // Fetch transactions assigned to this validator, once validatorAddress is available.
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${document.location.origin}/api/transaction-pool-map`);
        const data = await res.json();
        // Filter transactions that include the validator's public key in assignedValidators.
        const txList = Object.values(data).filter(
          tx => tx.assignedValidators && tx.assignedValidators.includes(validatorAddress)
        );
        setTransactions(txList);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };
    if (validatorAddress) {
      const interval = setInterval(fetchTransactions, 5000);
      return () => clearInterval(interval);
    }
  }, [validatorAddress]);

  const handleValidate = async (transactionId, approval) => {
    setResponseMessage('');
    const payload = {
      validatorId: validatorAddress,
      transactionId,
      sampleData: {
        temperature: Number(sampleData.temperature),
        humidity: Number(sampleData.humidity),
        freshness: Number(sampleData.freshness)
      },
      approval
    };
    try {
      const res = await fetch(`${document.location.origin}/api/validate-produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResponseMessage(`Validation successful for transaction ${transactionId}`);
      console.log('Validation response:', data);
    } catch (err) {
      setResponseMessage('Validation failed: ' + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Validator Dashboard</h2>
      <p>Your Validator Address: {validatorAddress}</p>
      {responseMessage && <p>{responseMessage}</p>}
      <h3>Pending Transactions for Validation</h3>
      {transactions.length === 0 ? (
        <p>No transactions assigned for validation.</p>
      ) : (
        <ul>
          {transactions.map(tx => (
            <li key={tx.id}>
              <p>Transaction ID: {tx.id}</p>
              <p>IoT Data: {tx.iotData}</p>
              <div>
                <input
                  type="number"
                  placeholder="Temperature"
                  onChange={(e) =>
                    setSampleData({ ...sampleData, temperature: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Humidity"
                  onChange={(e) =>
                    setSampleData({ ...sampleData, humidity: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Freshness"
                  onChange={(e) =>
                    setSampleData({ ...sampleData, freshness: e.target.value })
                  }
                />
                <button onClick={() => handleValidate(tx.id, "APPROVED")}>Approve</button>
                <button onClick={() => handleValidate(tx.id, "REJECTED")}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default ValidatorDashboard;
