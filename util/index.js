const EC = require('elliptic').ec;
const cryptoHash = require('./crypto-hash');
const keccak256 = require('js-sha3').keccak256;

const ec = new EC('secp256k1');

const verifySignature = ({ publicKey, data, signature }) => {
  const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(data), signature);
};
const sortCharacters = data => {
  return JSON.stringify(data).split('').sort().join('');
}
const keccakHash = data => {
  const hash = keccak256.create();

  hash.update(sortCharacters(data));

  return hash.hex();
}

const VALIDATORS = [
  'validator1_public_key',
  'validator2_public_key',
  // Add more validators here
];

module.exports = { ec, verifySignature,  sortCharacters,
  keccakHash,cryptoHash ,VALIDATORS};
