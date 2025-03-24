// src/components/CustomerBlock.js
import React, { useState } from 'react';
import TransactionSummary from './TransactionSummary';
import './CustomerBlock.css';

const CustomerBlock = ({ block, index }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate summary info from transactions (customize as needed)
  const transactions = block.data || [];
  const totalTransactions = transactions.length;
  // For example, average quality score:
  const avgQualityScore =
    totalTransactions > 0
      ? Math.round(transactions.reduce((sum, tx) => sum + (tx.qualityScore || 0), 0) / totalTransactions)
      : 0;

  // For validators, merge all assignedValidators from all transactions (unique set)
  const allValidators = Array.from(
    new Set(transactions.flatMap(tx => tx.assignedValidators || []))
  );

  // Basic summary string for block transactions
  const summary = (
    <div className="block-summary-info">
      <p>
        <span>Txns:</span> {totalTransactions} | <span>Avg Quality:</span> {avgQualityScore} 

      </p>
      <p>
      <span>Validators:</span> {allValidators.join(', ').slice(0, 10)}...
      </p>
    </div>
  );

  return (
    <div className="customer-block">
      <div className="block-header" onClick={() => setShowDetails(!showDetails)}>
        <p>
          <strong>Block #{index + 1}</strong>
        </p>
        <p>
          <span>Timestamp:</span> {new Date(block.timestamp).toLocaleString()}
        </p>
        {summary}
      </div>
      {showDetails && (
        <div className="block-details">
          <p>
            <strong>Hash:</strong> {block.hash}
          </p>
          <p>
            <strong>Last Hash:</strong> {block.lastHash}
          </p>
          <p>
            <strong>Nonce:</strong> {block.nonce}
          </p>
          <p>
            <strong>Difficulty:</strong> {block.difficulty}
          </p>
          <p>
            <strong>Merkle Root:</strong> {block.merkleRoot}
          </p>
          <p>
            <strong>Quality Score:</strong> {block.qualityScore}
          </p>
          <div className="transactions-container">
            <h4>Transactions:</h4>
            {transactions.length === 0 ? (
              <p>No transactions.</p>
            ) : (
              transactions.map(tx => (
                <TransactionSummary key={tx.id} transaction={tx} />
              ))
            )}
          </div>
          <button className="close-btn" onClick={() => setShowDetails(false)}>Close Details</button>
        </div>
      )}
    </div>
  );
};

export default CustomerBlock;
