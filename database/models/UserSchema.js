const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  bankAccounts: [{ type: String, ref: 'BankAccount' }] // Reference to multiple bank accounts
});

const User = mongoose.model('User', userSchema);

module.exports = User;
