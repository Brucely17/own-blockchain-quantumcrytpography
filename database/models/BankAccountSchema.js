const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
<<<<<<< HEAD
 
  accountNumber: { type: String, required: true },
  name:{type: String,required:true},
  // username:{type}
=======
  accountNumber: { type: String, required: true },
>>>>>>> 151f5aa205b7a3a77b32b69d432fd2d8543d4f83
  ifscCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  balance: { type: Number },
 
  bankAccountId: { type: String} // Self-reference to bank account ID
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;
