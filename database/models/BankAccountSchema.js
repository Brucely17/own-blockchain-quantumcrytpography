const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
 
  accountNumber: { type: String, required: true },
  name:{type: String,required:true},
  // username:{type}
  ifscCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  balance: { type: Number },
 
  bankAccountId: { type: String} // Self-reference to bank account ID
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;
