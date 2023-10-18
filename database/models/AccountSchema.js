const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({

  accountNumber: { type: String, required: true },
  name: { type: String, required: true },
  ifscCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  balance: { type: Number }
 
    
});

module.exports = mongoose.model('Account', AccountSchema);
