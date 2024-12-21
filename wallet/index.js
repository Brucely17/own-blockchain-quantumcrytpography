const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');
const crypto = require('crypto');
class Wallet {
  constructor() {
    

    this.balance =STARTING_BALANCE||0;

    this.keyPair = ec.genKeyPair();
    
    // this.privateKey=this.keyPair.getPrivate().toBuffer().digest('hex');
    // console.log('pribate key:',this.keyPair.getPrivate('hex'));
    // console.log('parsed:',JSON.parse(JSON.stringify(this.keyPair)),'compare:',this.keyPair);
    this.privateKey=this.keyPair.getPrivate('hex');
    this.publicKey = this.keyPair.getPublic().encode('hex');
    // console.log(this.publicKey);
  }

  sign(data) {

    // console.log('signing data:',this.privateKey.sign(cryptoHash(data)));
    // console.log('signing data  check:',(ec.sign(cryptoHash(data),this.keyPair.getPrivate('hex'))).toDER('hex'))
    
    return (ec.sign(cryptoHash(data),this.keyPair.getPrivate('hex'))).toDER('hex');
    // console.log('signing data:',this.keyPair.sign(cryptoHash(data)));
    // return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({ recipient, amount, chain }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }

      if (hasConductedTransaction) {
        break;
      }
    }

    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
}

module.exports = Wallet;
