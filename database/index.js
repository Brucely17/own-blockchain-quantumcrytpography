// server.js
const express = require('express');
const mongoose = require('mongoose');
const BankAccount = require('./models/AccountSchema');
const db=require('./db')
const app = express();
app.use(express.json());

db.getDatabase()

// Create a new bank account
app.post('/api/bankaccounts', async (req, res) => {
  try {
    const bankAccount = await BankAccount.create(req.body);
    res.json(bankAccount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bank accounts
app.get('/api/bankaccounts', async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find();
    res.json(bankAccounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Other CRUD operations (update, delete) can be similarly implemented

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
