// src/components/WalletInfo.js
import React from 'react';
import './Wallet.css';

const WalletInfo = ({ address, balance, staked }) => {
  return (
    <div className="wallet-info-container">
     
      <h2><strong>Address:</strong> </h2>
      <p className="public-key">{address}</p>
      <h2><strong>Balance:</strong></h2>
      <p>{balance}</p>
      <h2><strong>Staked Tokens:</strong> </h2>
      <p>{staked}</p>
     
    </div>
  );
};

export default WalletInfo;
