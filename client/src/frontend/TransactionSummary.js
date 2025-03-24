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
          <span>Quality:</span> {transaction.qualityScore} ({transaction.qualityDecision})
        </p>
      </div>
      {showDetails && (
        <div className="summary-details">
          <p><strong>Input Address:</strong> {transaction.input.address}</p>
          <p><strong>Output Map:</strong> {JSON.stringify(transaction.outputMap)}</p>
          <p><strong>Validator Approvals:</strong> {JSON.stringify(transaction.validatorApprovals)}</p>
          <p><strong>IoT Data:</strong></p>
          {parsedIotData ? (
            <ul>
              {Object.entries(parsedIotData).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          ) : (
            <p>Loading IoT data...</p>
          )}
          <p><strong>Sample Data:</strong> {transaction.sampleData}</p>
          <button onClick={toggleDetails} className="close-btn">Close</button>
        </div>
      )}
    </div>
  );
};

export default TransactionSummary;
