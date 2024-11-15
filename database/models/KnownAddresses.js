// models/KnownAddress.js

const mongoose = require('mongoose');

const knownAddressSchema = new mongoose.Schema({
  publicKey: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const KnownAddress = mongoose.model('KnownAddress', knownAddressSchema);

module.exports = KnownAddress;
