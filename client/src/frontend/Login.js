// src/components/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
//   const history = useHistory();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage('');
    setWalletAddress('');
    
    try {
      // Register the user
      const res = await fetch(`${document.location.origin}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      setResponseMessage(data.message);
      setWalletAddress(data.address);

      // Redirect based on role
      
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
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
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
          {walletAddress && (
            <p>
              <Link to={`/${role}`}>Go to Dashboard</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
