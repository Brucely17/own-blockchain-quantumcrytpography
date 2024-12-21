import React, { useState } from 'react';
import './AccountData.css';
import { withRouter } from 'react-router-dom';
const AccountData = ({history}) => {
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    ifscCode: '',
    phoneNumber: '',
    email:'',
    balance:0,
   
   
   
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    console.log(formData)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`${document.location.origin}/api/bankaccounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    console.log('Bank account created:', data);
    // history.push(`/?username=${data.name}&accountNumber=${data.bankAccountId}`);
    // history.push(`/?name=${formData.name}`);
    history.push('/');

  };

  return (
    <div>
      <h2>Create Bank Account</h2>
      <form className="form-group" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="accountNumber" className='label'>Account Number: </label>
          <input type="text" id="accountNumber"  className='input'  onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="name" className='label'>Name: </label>
          <input type="text" id="name" className='input' onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="ifscCode" className='label'>IFSC code: </label>
          <input type="text" id="ifscCode" className='input'  onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="phoneNumber" className='label'>Phone Number: </label>
          <input type="text" id="phoneNumber" className='input'  onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="email" className='label'>Email Id: </label>
          <input type="email" id="email" className='input' onChange={handleChange} />
        </div>
        <button type="submit" className='button'>Create Account</button>
      </form>
    </div>
  );
};

export default AccountData;
