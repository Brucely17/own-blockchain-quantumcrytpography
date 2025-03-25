// src/components/TransactionSummary.js
import React, { useState, useEffect } from 'react';
import './TransactionSummary.css';

const TransactionSummary = ({ transaction }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [parsedIotData, setParsedIotData] = useState(null);

  // Fetch IoT data from backend if it's a hash (string)
  useEffect(() => {
    if (typeof transaction.iotData === 'string') {
      fetch(`${document.location.origin}/api/ipfs/${transaction.iotData}`)
        .then(res => res.json())
        .then(data => setParsedIotData(data))
        .catch(err => console.error("Error retrieving IoT data:", err));
    } else {
      setParsedIotData(transaction.iotData);
    }
  }, [transaction.iotData]);

  const toggleDetails = () => setShowDetails(!showDetails);

  // Helper to safely render an object
  const renderObject = (obj) => {
    if (!obj) return null;
    return (
      <ul>
        {Object.entries(obj).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
          </li>
        ))}
      </ul>
    );
  };

  // Ensure qualityScore is rendered as a number (or string)
  const qualityScoreDisplay = typeof transaction.qualityScore === 'number'
    ? transaction.qualityScore
    : JSON.stringify(transaction.qualityScore);

  return (
    <div className="transaction-summary">
      <div className="summary-header" onClick={toggleDetails}>
        <p>
          <strong>ID:</strong> {transaction.id.slice(0, 8)}...
        </p>
        <p>
          <span>Price/Kg:</span> {transaction.pricePerKg} | <span>Qty:</span> {transaction.quantity}
        </p>
        <p>
          <span>Quality:</span> {qualityScoreDisplay} ({transaction.qualityDecision})
        </p>
      </div>
      {showDetails && (
        <div className="summary-details">
          <p><strong>Input Address:</strong> {transaction.input && transaction.input.address}</p>
          <p><strong>Output Map:</strong> {transaction.outputMap ? JSON.stringify(transaction.outputMap) : 'N/A'}</p>
          <p><strong>Validator Approvals:</strong> {transaction.validatorApprovals ? JSON.stringify(transaction.validatorApprovals) : 'N/A'}</p>
          <p><strong>IoT Data:</strong></p>
          {parsedIotData ? renderObject(parsedIotData) : <p>Loading IoT data...</p>}
          <p><strong>Sample Data:</strong></p>
          {transaction.sampleData ? renderObject(transaction.sampleData) : <p>N/A</p>}
          <button onClick={toggleDetails} className="close-btn">Close</button>
        </div>
      )}
    </div>
  );
};

export default TransactionSummary;
