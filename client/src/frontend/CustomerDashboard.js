// src/components/CustomerDashboard.js
import React, { useState, useEffect } from 'react';
import './CustomerDashBoard.css';
import CustomerBlockchain from './CustomerBlockchain';
const CustomerDashboard = () => {
  const [blockchain, setBlockchain] = useState([]);

  

  return (
    <div className="dashboard-container">
      <CustomerBlockchain/>
    </div>
  );
};

export default CustomerDashboard;
