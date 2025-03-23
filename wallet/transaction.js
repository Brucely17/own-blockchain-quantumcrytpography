// wallet/transaction.js
const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD, VALIDATOR_REWARD_PERCENT, PLATFORM_FEE_PERCENT } = require('../config');
const QualityCheck = require('../validators/quality-algorithm');
const IPFS = require('../util/ipfs');

class Transaction {
  constructor({ senderWallet, recipient, amount, pricePerKg, quantity, outputMap, input, iotData, sampleData, validatorApprovals, qualityScore }) {
    this.id = uuid();
    this.iotData = iotData || {};
    this.sampleData = sampleData || {};
    this.validatorApprovals = validatorApprovals || {}; // e.g., { validatorPublicKey: "APPROVED" }
    this.qualityScore = qualityScore || 0;
    this.qualityDecision = "PENDING";
    this.stakedValidators = {};
    this.assignedValidators = []; // Array of public keys of validators assigned to this transaction
    this.pricePerKg = pricePerKg || 0;
    this.quantity = quantity || 0;
    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};
    const validatorReward = (amount * VALIDATOR_REWARD_PERCENT) / 100;
    const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
    const farmerAmount = amount - validatorReward - platformFee;
    outputMap[recipient] = farmerAmount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    return outputMap;
  }

  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
  }

  // Allow only validators in assignedValidators to vote.
  updateValidation({ validatorWallet, approval }) {
    if (!this.assignedValidators.includes(validatorWallet.publicKey)) {
      console.warn(`Validator ${validatorWallet.publicKey} is not assigned to transaction ${this.id}`);
      return;
    }
    this.validatorApprovals[validatorWallet.publicKey] = approval;
  }

  // Asynchronously finalize the transaction once all votes are in.
  async finalizeTransaction() {
    const totalAssigned = this.assignedValidators.length;
    const votes = Object.keys(this.validatorApprovals).length;
    if (votes < totalAssigned) {
      console.log(`Transaction ${this.id} waiting for all ${totalAssigned} votes. Currently received: ${votes}`);
      return;
    }
    
    // Retrieve IoT and sample data from IPFS if they are stored as hash strings.
    let iotDataObj = this.iotData;
    let sampleDataObj = this.sampleData;
    if (typeof this.iotData === 'string') {
      try {
        iotDataObj = await IPFS.getJSON(this.iotData);
      } catch (e) {
        console.error("Error retrieving IoT data from IPFS", e);
      }
    }
    if (typeof this.sampleData === 'string') {
      try {
        sampleDataObj = await IPFS.getJSON(this.sampleData);
      } catch (e) {
        console.error("Error retrieving sample data from IPFS", e);
      }
    }
    
    // Count approvals from assigned validators.
    const approvals = Object.values(this.validatorApprovals).filter(
      vote => vote === "APPROVED" || vote === "STAKE_APPROVE"
    ).length;
    
    if (approvals >= Math.ceil(totalAssigned / 2)) {
      console.log(`Transaction ${this.id} approved by majority of validators`);
      // Even if validators approve, run quality evaluation to compute a quality score.
      const aiResult = QualityCheck.evaluateQuality(iotDataObj, sampleDataObj, this.input.address);
      this.qualityScore = aiResult.qualityScore;
      this.qualityDecision = "APPROVED";
    } else {
      console.log(`Insufficient approvals for transaction ${this.id}. Running AI Quality Check...`);
      const aiDecision = QualityCheck.evaluateQuality(iotDataObj, sampleDataObj, this.input.address);
      this.qualityScore = aiDecision.qualityScore;
      if (aiDecision.decision === "AUTO_APPROVE") {
        console.log(`AI auto-approved transaction ${this.id}`);
        this.qualityDecision = "AI_APPROVED";
      } else {
        console.log(`Transaction ${this.id} rejected by validators and AI`);
        this.qualityDecision = "REJECTED";
      }
    }
  }

  static validTransaction(transaction) {
    const { input: { address, amount, signature }, outputMap } = transaction;
    const outputTotal = Object.values(outputMap).reduce((total, outputAmount) => total + outputAmount, 0);
    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}: input and output totals do not match.`);
      return false;
    }
    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }
    return true;
  }

  static rewardTransaction({ minerWallet, validatorWallets }) {
    const validatorRewards = validatorWallets.reduce((acc, wallet) => {
      acc[wallet.publicKey] = MINING_REWARD / validatorWallets.length;
      return acc;
    }, {});
    return new this({
      input: REWARD_INPUT,
      outputMap: {
        ...validatorRewards,
        [minerWallet.publicKey]: MINING_REWARD
      }
    });
  }

  static fromJSON(transactionObj) {
    const transaction = new Transaction({ 
      senderWallet: transactionObj.input ? { publicKey: transactionObj.input.address, balance: transactionObj.input.amount } : {}, 
      recipient: Object.keys(transactionObj.outputMap)[0], 
      amount: transactionObj.input ? transactionObj.input.amount : 0, 
      pricePerKg: transactionObj.pricePerKg,
      quantity: transactionObj.quantity,
      outputMap: transactionObj.outputMap,
      input: transactionObj.input,
      iotData: transactionObj.iotData,
      sampleData: transactionObj.sampleData,
      validatorApprovals: transactionObj.validatorApprovals,
      qualityScore: transactionObj.qualityScore
    });
    transaction.assignedValidators = transactionObj.assignedValidators || [];
    Object.assign(transaction, transactionObj);
    return transaction;
  }
}

module.exports = Transaction;

// const uuid = require('uuid/v1');
// const { verifySignature } = require('../util');
// const { REWARD_INPUT, MINING_REWARD, VALIDATOR_REWARD_PERCENT, PLATFORM_FEE_PERCENT } = require('../config');
// const QualityCheck = require('../validators/quality-algorithm');

// class Transaction {
//   constructor({ senderWallet, recipient, amount, pricePerKg, quantity, outputMap, input, iotData, sampleData, validatorApprovals, qualityScore }) {
//     this.id = uuid();
//     this.iotData = iotData || {};
//     this.sampleData = sampleData || {};
//     this.validatorApprovals = validatorApprovals || {};  // { validatorPublicKey: vote }
//     this.qualityScore = qualityScore || 0;
//     this.qualityDecision = "PENDING";
//     this.stakedValidators = {};
//     // New: an array of assigned validator public keys
//     this.assignedValidators = [];
//     // Save extra properties for payment calculation.
//     this.pricePerKg = pricePerKg || 0;
//     this.quantity = quantity || 0;
    
//     this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
//     this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
//   }

//   createOutputMap({ senderWallet, recipient, amount }) {
//     const outputMap = {};
//     const validatorReward = (amount * VALIDATOR_REWARD_PERCENT) / 100;
//     const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
//     const farmerAmount = amount - validatorReward - platformFee;
//     outputMap[recipient] = farmerAmount;
//     outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
//     return outputMap;
//   }

//   createInput({ senderWallet, outputMap }) {
//     return {
//       timestamp: Date.now(),
//       amount: senderWallet.balance,
//       address: senderWallet.publicKey,
//       signature: senderWallet.sign(outputMap)
//     };
//   }

//   // Accept votes only from validators that are assigned.
//   updateValidation({ validatorWallet, approval }) {
//     if (!this.assignedValidators.includes(validatorWallet.publicKey)) {
//       console.warn(`Validator ${validatorWallet.publicKey} is not assigned to transaction ${this.id}`);
//       return;
//     }
//     this.validatorApprovals[validatorWallet.publicKey] = approval;
//   }

//   // Finalize the transaction when all assigned validators have voted.
//   finalizeTransaction() {
//     const totalAssigned = this.assignedValidators.length;
//     const votes = Object.keys(this.validatorApprovals).length;
    
//     // Wait for all assigned validators to vote
//     if (votes < totalAssigned) {
//       console.log(`Transaction ${this.id} waiting for all ${totalAssigned} votes. Currently received: ${votes}`);
//       return;
//     }
    
//     // Count approvals from assigned validators
//     const approvals = Object.values(this.validatorApprovals).filter(
//       vote => vote === "APPROVED" || vote === "STAKE_APPROVE"
//     ).length;
    
//     if (approvals >= Math.ceil(totalAssigned / 2)) {
//       console.log(`✅ Transaction ${this.id} approved by majority of validators`);
//       // Run quality evaluation to compute quality score even if approved by validators.
//       const aiResult = QualityCheck.evaluateQuality(this.iotData, this.sampleData, this.input.address);
//       this.qualityScore = aiResult.qualityScore; // Update qualityScore based on AI evaluation
//       this.qualityDecision = "APPROVED";
//     } else {
//       console.log(`⚠️ Insufficient validator approvals for transaction ${this.id}. Running AI Quality Check...`);
//       const aiDecision = QualityCheck.evaluateQuality(this.iotData, this.sampleData, this.input.address);
//       this.qualityScore = aiDecision.qualityScore; // Update qualityScore from AI result
//       if (aiDecision.decision === "AUTO_APPROVE") {
//         console.log(`🤖 AI auto-approved transaction ${this.id}`);
//         this.qualityDecision = "AI_APPROVED";
//       } else {
//         console.log(`❌ Transaction ${this.id} rejected by validators and AI`);
//         this.qualityDecision = "REJECTED";
//       }
//     }
//   }
  
//   static validTransaction(transaction) {
//     const { input: { address, amount, signature }, outputMap } = transaction;
//     const outputTotal = Object.values(outputMap).reduce((total, outputAmount) => total + outputAmount, 0);
//     if (amount !== outputTotal) {
//       console.error(`❌ Invalid transaction from ${address}: input and output totals do not match.`);
//       return false;
//     }
//     if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
//       console.error(`❌ Invalid signature from ${address}`);
//       return false;
//     }
//     return true;
//   }

//   static rewardTransaction({ minerWallet, validatorWallets }) {
//     const validatorRewards = validatorWallets.reduce((acc, wallet) => {
//       acc[wallet.publicKey] = MINING_REWARD / validatorWallets.length;
//       return acc;
//     }, {});
//     return new this({
//       input: REWARD_INPUT,
//       outputMap: {
//         ...validatorRewards,
//         [minerWallet.publicKey]: MINING_REWARD
//       }
//     });
//   }

//   static fromJSON(transactionObj) {
//     const transaction = new Transaction({ 
//       senderWallet: transactionObj.input ? { publicKey: transactionObj.input.address, balance: transactionObj.input.amount } : {}, 
//       recipient: Object.keys(transactionObj.outputMap)[0], 
//       amount: transactionObj.input ? transactionObj.input.amount : 0, 
//       pricePerKg: transactionObj.pricePerKg,
//       quantity: transactionObj.quantity,
//       outputMap: transactionObj.outputMap,
//       input: transactionObj.input,
//       iotData: transactionObj.iotData,
//       sampleData: transactionObj.sampleData,
//       validatorApprovals: transactionObj.validatorApprovals,
//       qualityScore: transactionObj.qualityScore
//     });
//     transaction.assignedValidators = transactionObj.assignedValidators || [];
//     Object.assign(transaction, transactionObj);
//     return transaction;
//   }
// }

// module.exports = Transaction;

// // const uuid = require('uuid/v1');
// // const { verifySignature } = require('../util');
// // const { REWARD_INPUT, MINING_REWARD } = require('../config');

// // class Transaction {
// //   constructor({ senderWallet, recipient, amount, outputMap, input }) {
// //     this.id = uuid();
// //     this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
// //     this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
// //   }

// //   createOutputMap({ senderWallet, recipient, amount }) {
// //     const outputMap = {};

// //     outputMap[recipient] = amount;
// //     outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

// //     return outputMap;
// //   }

// //   createInput({ senderWallet, outputMap }) {
// //     return {
// //       timestamp: Date.now(),
// //       amount: senderWallet.balance,
// //       address: senderWallet.publicKey,
// //       signature: senderWallet.sign(outputMap)
// //     };
// //   }

// //   update({ senderWallet, recipient, amount }) {
// //     if (amount > this.outputMap[senderWallet.publicKey]) {
// //       throw new Error('Amount exceeds balance');
// //     }

// //     if (!this.outputMap[recipient]) {
// //       this.outputMap[recipient] = amount;
// //     } 
      
// //     this.outputMap[recipient] = recipient.balance + amount;
// //       alert('Amount has been added to reciever');
    
// //     // this.outputMap[recipient] = this.outputMap[recipient] - amount;
// //     this.outputMap[senderWallet.publicKey] =
// //       this.outputMap[senderWallet.publicKey] - amount;

// //     this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
// //   }

// //   static validTransaction(transaction) {
// //     const { input: { address, amount, signature }, outputMap } = transaction;

// //     const outputTotal = Object.values(outputMap)
// //       .reduce((total, outputAmount) => total + outputAmount);

// //     if (amount !== outputTotal) {
// //       console.error(`Invalid transaction from ${address}`);

// //       return false;
// //     }

// //     if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
// //       console.error(`Invalid signature from ${address}`);
// //       return false;
// //     }

// //     return true;
// //   }

// //   static rewardTransaction({ minerWallet }) {
// //     return new this({
// //       input: REWARD_INPUT,
// //       outputMap: { [minerWallet.publicKey]: MINING_REWARD }
// //     });
// //   }
// // };

// // module.exports = Transaction;
// // const uuid = require('uuid/v1');
// // const { verifySignature } = require('../util');
// // const { REWARD_INPUT, MINING_REWARD, VALIDATOR_REWARD_PERCENT, PLATFORM_FEE_PERCENT } = require('../config');

// // class Transaction {
// //   constructor({ senderWallet, recipient, amount, outputMap, input, iotData, sampleData, validatorApprovals, qualityScore }) {
// //     this.id = uuid();
// //     this.iotData = iotData || {};  // ✅ Stores IoT sensor data for produce quality
// //     this.sampleData = sampleData || {};  // ✅ Stores on-site physical validation data
// //     this.validatorApprovals = validatorApprovals || {};  // ✅ Keeps track of validator decisions
// //     this.qualityScore = qualityScore || 0;  // ✅ AI-generated quality score
// //     this.qualityDecision = "PENDING";  // ✅ AI or validator approval status

// //     this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
// //     this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
// //   }

// //   /**
// //    * ✅ Creates an output map for payment distribution.
// //    */
// //   createOutputMap({ senderWallet, recipient, amount }) {
// //     const outputMap = {};

// //     // ✅ Calculate payment splits
// //     const validatorReward = (amount * VALIDATOR_REWARD_PERCENT) / 100;
// //     const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
// //     const farmerAmount = amount - validatorReward - platformFee;

// //     outputMap[recipient] = farmerAmount;  // ✅ Farmer receives their payment
// //     outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    
// //     return outputMap;
// //   }

// //   /**
// //    * ✅ Creates input metadata for the transaction.
// //    */
// //   createInput({ senderWallet, outputMap }) {
// //     return {
// //       timestamp: Date.now(),
// //       amount: senderWallet.balance,
// //       address: senderWallet.publicKey,
// //       signature: senderWallet.sign(outputMap)
// //     };
// //   }

// //   /**
// //    * ✅ Updates a transaction with additional validator approvals.
// //    */
// //   updateValidation({ validatorWallet, approval }) {
// //     this.validatorApprovals[validatorWallet.publicKey] = approval;
// //   }

// //   /**
// //    * ✅ Finalizes the transaction based on validator consensus.
// //    */
// //   finalizeTransaction() {
// //     const approvals = Object.values(this.validatorApprovals);
// //     const approvalCount = approvals.filter(a => a === "APPROVED").length;
// //     const rejectionCount = approvals.filter(a => a === "REJECTED").length;

// //     if (approvalCount > rejectionCount) {
// //       this.qualityDecision = "APPROVED";
// //     } else {
// //       this.qualityDecision = "REJECTED";
// //     }
// //   }

// //   /**
// //    * ✅ Validates transaction integrity.
// //    */
// //   static validTransaction(transaction) {
// //     const { input: { address, amount, signature }, outputMap } = transaction;

// //     const outputTotal = Object.values(outputMap)
// //       .reduce((total, outputAmount) => total + outputAmount);

// //     if (amount !== outputTotal) {
// //       console.error(`Invalid transaction from ${address}`);
// //       return false;
// //     }

// //     if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
// //       console.error(`Invalid signature from ${address}`);
// //       return false;
// //     }

// //     return true;
// //   }

// //   /**
// //    * ✅ Creates a reward transaction for miners.
// //    */
// //   static rewardTransaction({ minerWallet }) {
// //     return new this({
// //       input: REWARD_INPUT,
// //       outputMap: { [minerWallet.publicKey]: MINING_REWARD }
// //     });
// //   }
// // }

// // module.exports = Transaction;
