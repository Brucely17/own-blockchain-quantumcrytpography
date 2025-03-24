// src/components/CustomerBlockchain.js
import React, { useState, useEffect } from 'react';
import CustomerBlock from './CustomerBlock';
import './CustomerBlockchain.css';

const CustomerBlockchain = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const fetchBlockchain = async () => {
      try {
        const res = await fetch(`${document.location.origin}/api/blocks`);
        const data = await res.json();
        // Exclude genesis block if desired:
        setBlocks(data.slice(1));
      } catch (err) {
        console.error("Error fetching blockchain:", err);
      }
    };
    fetchBlockchain();
    const interval = setInterval(fetchBlockchain, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="customer-blockchain">
      <h2>Blockchain Overview</h2>
      {blocks.length === 0 ? (
        <p>No blocks available.</p>
      ) : (
        blocks.map((block, index) => (
          <CustomerBlock key={block.hash} block={block} index={index} />
        ))
      )}
    </div>
  );
};

export default CustomerBlockchain;
