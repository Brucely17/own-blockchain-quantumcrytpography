const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  balance: { type: Number, required: true },
<<<<<<< HEAD
  bankAccountId: { type: String} // Reference to bank account
=======
  bankAccountId: { type: String, ref: 'BankAccount' } // Reference to bank account
>>>>>>> 151f5aa205b7a3a77b32b69d432fd2d8543d4f83
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
