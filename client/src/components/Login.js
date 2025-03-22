// src/pages/Login.jsx
import React, { useState } from 'react';
// import { useHistory } from 'react-router-dom';
// import '../styles/Login.css';

const Login = () => {
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  // const history = useHistory();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage('');
    setWalletAddress('');
    try {
      // Register the user by role
      const res = await fetch(`${document.location.origin}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      setResponseMessage(data.message);
      
      // After registration, retrieve wallet info from /api/wallet-info
      const walletRes = await fetch(`${document.location.origin}/api/wallet-info`);
      const walletData = await walletRes.json();
      setWalletAddress(walletData.address);
      
      // Optionally redirect based on role
      // if (role === 'farmer') {
      //   history.push('/farmer');
      // } else if (role === 'validator') {
      //   history.push('/validator');
      // } else if (role === 'customer') {
      //   history.push('/customer');
      // }
    } catch (error) {
      setResponseMessage('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Register / Login</h1>
      <form onSubmit={handleRegister}>
        <label htmlFor="role">Select your role:</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="farmer">Farmer</option>
          <option value="validator">Validator</option>
          <option value="customer">Customer</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {responseMessage && (
        <div className="response">
          <p>{responseMessage}</p>
          {walletAddress && <p>Your wallet address: {walletAddress}</p>}
        </div>
      )}
    </div>
  );
};

export default Login;