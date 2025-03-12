const Transaction = require('./transaction');
const { STARTING_BALANCE, VALIDATOR_STAKE_AMOUNT } = require('../config'); // ✅ Includes staking amount for validators
const { ec, cryptoHash } = require('../util');
const crypto = require('crypto');

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE || 0;
    this.keyPair = ec.genKeyPair();
    this.privateKey = this.keyPair.getPrivate('hex');
    this.publicKey = this.keyPair.getPublic().encode('hex');
    this.stake = 0; // ✅ Stores staked amount for validators
    this.isValidator = false; // ✅ Tracks if wallet is acting as a validator
  }

  /**
   * ✅ Signs data with the wallet's private key.
   */
  sign(data) {
    return ec.sign(cryptoHash(data), this.keyPair.getPrivate('hex')).toDER('hex');
  }

  /**
   * ✅ Creates a new transaction and verifies balance.
   */
  createTransaction({ recipient, amount, chain }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({ chain, address: this.publicKey });
    }

    if (amount > this.balance) {
      throw new Error('❌ ERROR: Amount exceeds wallet balance.');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  /**
   * ✅ Allows validators to stake a fixed amount to participate.
   */
  stakeTokens() {
    if (this.balance < VALIDATOR_STAKE_AMOUNT) {
      throw new Error('❌ ERROR: Not enough balance to stake as a validator.');
    }

    this.stake = VALIDATOR_STAKE_AMOUNT;
    this.balance -= VALIDATOR_STAKE_AMOUNT;
    this.isValidator = true; // ✅ Marks wallet as validator
    console.log(`✅ Validator ${this.publicKey} has staked ${VALIDATOR_STAKE_AMOUNT} tokens.`);
  }

  /**
   * ✅ Allows a validator to withdraw their stake.
   * - Removes them from validator selection.
   */
  withdrawStake() {
    if (this.stake === 0) {
      throw new Error('❌ ERROR: No staked tokens available to withdraw.');
    }

    this.balance += this.stake;
    this.stake = 0;
    this.isValidator = false;
    console.log(`❌ Validator ${this.publicKey} has withdrawn their stake.`);
  }

  /**
   * ✅ Calculates balance dynamically by scanning the blockchain.
   */
  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal += addressOutput;
        }
      }

      if (hasConductedTransaction) break;
    }

    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }

  /**
   * ✅ Checks if wallet is an active validator.
   * - Ensures validator **has staked tokens** and is **not inactive**.
   */
  isActiveValidator() {
    return this.isValidator && this.stake >= VALIDATOR_STAKE_AMOUNT;
  }
}

module.exports = Wallet;



// const Transaction = require('./transaction');
// const { STARTING_BALANCE } = require('../config');
// const { ec, cryptoHash } = require('../util');
// const crypto = require('crypto');
// class Wallet {
//   constructor() {
    

//     this.balance =STARTING_BALANCE||0;

//     this.keyPair = ec.genKeyPair();
    
//     // this.privateKey=this.keyPair.getPrivate().toBuffer().digest('hex');
//     // console.log('pribate key:',this.keyPair.getPrivate('hex'));
//     // console.log('parsed:',JSON.parse(JSON.stringify(this.keyPair)),'compare:',this.keyPair);
//     this.privateKey=this.keyPair.getPrivate('hex');
//     this.publicKey = this.keyPair.getPublic().encode('hex');
//     // console.log(this.publicKey);
//   }

//   sign(data) {

//     // console.log('signing data:',this.privateKey.sign(cryptoHash(data)));
//     // console.log('signing data  check:',(ec.sign(cryptoHash(data),this.keyPair.getPrivate('hex'))).toDER('hex'))
    
//     return (ec.sign(cryptoHash(data),this.keyPair.getPrivate('hex'))).toDER('hex');
//     // console.log('signing data:',this.keyPair.sign(cryptoHash(data)));
//     // return this.keyPair.sign(cryptoHash(data));
//   }

//   createTransaction({ recipient, amount, chain }) {
//     if (chain) {
//       this.balance = Wallet.calculateBalance({
//         chain,
//         address: this.publicKey
//       });
//     }

//     if (amount > this.balance) {
//       throw new Error('Amount exceeds balance');
//     }

//     return new Transaction({ senderWallet: this, recipient, amount });
//   }

//   static calculateBalance({ chain, address }) {
//     let hasConductedTransaction = false;
//     let outputsTotal = 0;

//     for (let i=chain.length-1; i>0; i--) {
//       const block = chain[i];

//       for (let transaction of block.data) {
//         if (transaction.input.address === address) {
//           hasConductedTransaction = true;
//         }

//         const addressOutput = transaction.outputMap[address];

//         if (addressOutput) {
//           outputsTotal = outputsTotal + addressOutput;
//         }
//       }

//       if (hasConductedTransaction) {
//         break;
//       }
//     }

//     return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
//   }
// }

// module.exports = Wallet;
// const Transaction = require('./transaction');
// const { STARTING_BALANCE, VALIDATOR_STAKE_AMOUNT } = require('../config'); // ✅ Includes staking amount for validators
// const { ec, cryptoHash } = require('../util');
// const crypto = require('crypto');

// class Wallet {
//   constructor() {
//     this.balance = STARTING_BALANCE || 0;
//     this.keyPair = ec.genKeyPair();
//     this.privateKey = this.keyPair.getPrivate('hex');
//     this.publicKey = this.keyPair.getPublic().encode('hex');
//     this.stake = 0; // ✅ New: Stores staked amount for validators
//   }

//   /**
//    * ✅ Signs data with the wallet's private key.
//    */
//   sign(data) {
//     return ec.sign(cryptoHash(data), this.keyPair.getPrivate('hex')).toDER('hex');
//   }

//   /**
//    * ✅ Creates a new transaction and verifies balance.
//    */
//   createTransaction({ recipient, amount, chain }) {
//     if (chain) {
//       this.balance = Wallet.calculateBalance({ chain, address: this.publicKey });
//     }

//     if (amount > this.balance) {
//       throw new Error('Amount exceeds balance');
//     }

//     return new Transaction({ senderWallet: this, recipient, amount });
//   }

//   /**
//    * ✅ Allows validators to stake a fixed amount.
//    */
//   stakeTokens() {
//     if (this.balance < VALIDATOR_STAKE_AMOUNT) {
//       throw new Error('Not enough balance to stake as a validator');
//     }

//     this.stake = VALIDATOR_STAKE_AMOUNT;
//     this.balance -= VALIDATOR_STAKE_AMOUNT;
//     console.log(`Validator ${this.publicKey} has staked ${VALIDATOR_STAKE_AMOUNT} tokens.`);
//   }

//   /**
//    * ✅ Returns the balance of a wallet address by scanning the blockchain.
//    */
//   static calculateBalance({ chain, address }) {
//     let hasConductedTransaction = false;
//     let outputsTotal = 0;

//     for (let i = chain.length - 1; i > 0; i--) {
//       const block = chain[i];

//       for (let transaction of block.data) {
//         if (transaction.input.address === address) {
//           hasConductedTransaction = true;
//         }

//         const addressOutput = transaction.outputMap[address];

//         if (addressOutput) {
//           outputsTotal += addressOutput;
//         }
//       }

//       if (hasConductedTransaction) break;
//     }

//     return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
//   }
// }

// module.exports = Wallet;
