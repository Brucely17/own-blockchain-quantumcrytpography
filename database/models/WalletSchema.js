const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  balance: { type: Number, required: true },
  bankAccountId: { type: String} // Reference to bank account
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
