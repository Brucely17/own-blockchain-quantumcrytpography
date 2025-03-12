const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD, VALIDATOR_REWARD_PERCENT, PLATFORM_FEE_PERCENT } = require('../config');
const QualityCheck = require('../validators/quality-algorithm'); // ✅ AI-Based Quality Check

class Transaction {
  constructor({ senderWallet, recipient, amount, outputMap, input, iotData, sampleData, validatorApprovals, qualityScore }) {
    this.id = uuid();
    this.iotData = iotData || {};  // ✅ IoT sensor data for produce quality
    this.sampleData = sampleData || {};  // ✅ Physical validation data
    this.validatorApprovals = validatorApprovals || {};  // ✅ Validator decisions
    this.qualityScore = qualityScore || 0;  // ✅ AI-generated quality score
    this.qualityDecision = "PENDING";  // ✅ AI or validator approval status
    this.stakedValidators = {}; // ✅ Stores validators who have staked on this transaction

    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  /**
   * ✅ Creates an output map for payment distribution.
   */
  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};

    // ✅ Calculate payment splits
    const validatorReward = (amount * VALIDATOR_REWARD_PERCENT) / 100;
    const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
    const farmerAmount = amount - validatorReward - platformFee;

    outputMap[recipient] = farmerAmount;  // ✅ Farmer receives their payment
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    
    return outputMap;
  }

  /**
   * ✅ Creates input metadata for the transaction.
   */
  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
  }

  /**
   * ✅ Updates transaction with validator approval, rejection, or stake approval.
   */
  updateValidation({ validatorWallet, approval }) {
    this.validatorApprovals[validatorWallet.publicKey] = approval;

    if (approval === "STAKE_APPROVE") {
      this.stakedValidators[validatorWallet.publicKey] = true; // ✅ Allow validators to stake
    }
  }

  /**
   * ✅ Finalizes the transaction based on validator consensus & AI.
   */
  finalizeTransaction() {
    const approvals = Object.values(this.validatorApprovals);
    const approvalCount = approvals.filter(a => a === "APPROVED" || a === "STAKE_APPROVE").length;
    const rejectionCount = approvals.filter(a => a === "REJECTED").length;

    if (approvalCount > rejectionCount) {
      console.log(`✅ Transaction ${this.id} Approved by Validators`);
      this.qualityDecision = "APPROVED";
    } else {
      console.log(`⚠️ Transaction ${this.id} Rejected by Validators. Running AI Quality Check...`);
      
      // ✅ AI Quality Check as a final decision-maker
      const aiDecision = QualityCheck.evaluateQuality(this.iotData, this.sampleData);
      if (aiDecision.decision === "AUTO_APPROVE") {
        console.log(`🤖 AI Overriding Decision: Transaction ${this.id} Auto-Approved!`);
        this.qualityDecision = "AI_APPROVED";
      } else {
        console.log(`❌ AI & Validators Rejected Transaction ${this.id}`);
        this.qualityDecision = "REJECTED";
      }
    }
  }

  /**
   * ✅ Validates transaction integrity.
   */
  static validTransaction(transaction) {
    const { input: { address, amount, signature }, outputMap } = transaction;

    const outputTotal = Object.values(outputMap)
      .reduce((total, outputAmount) => total + outputAmount);

    if (amount !== outputTotal) {
      console.error(`❌ Invalid transaction from ${address}`);
      return false;
    }

    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`❌ Invalid signature from ${address}`);
      return false;
    }

    return true;
  }

  /**
   * ✅ Creates a reward transaction for miners & validators.
   */
  static rewardTransaction({ minerWallet, validatorWallets }) {
    const validatorRewards = validatorWallets.reduce((acc, wallet) => {
      acc[wallet.publicKey] = MINING_REWARD / validatorWallets.length; // ✅ Splits mining reward across validators
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
}

module.exports = Transaction;



// const uuid = require('uuid/v1');
// const { verifySignature } = require('../util');
// const { REWARD_INPUT, MINING_REWARD } = require('../config');

// class Transaction {
//   constructor({ senderWallet, recipient, amount, outputMap, input }) {
//     this.id = uuid();
//     this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
//     this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
//   }

//   createOutputMap({ senderWallet, recipient, amount }) {
//     const outputMap = {};

//     outputMap[recipient] = amount;
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

//   update({ senderWallet, recipient, amount }) {
//     if (amount > this.outputMap[senderWallet.publicKey]) {
//       throw new Error('Amount exceeds balance');
//     }

//     if (!this.outputMap[recipient]) {
//       this.outputMap[recipient] = amount;
//     } 
      
//     this.outputMap[recipient] = recipient.balance + amount;
//       alert('Amount has been added to reciever');
    
//     // this.outputMap[recipient] = this.outputMap[recipient] - amount;
//     this.outputMap[senderWallet.publicKey] =
//       this.outputMap[senderWallet.publicKey] - amount;

//     this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
//   }

//   static validTransaction(transaction) {
//     const { input: { address, amount, signature }, outputMap } = transaction;

//     const outputTotal = Object.values(outputMap)
//       .reduce((total, outputAmount) => total + outputAmount);

//     if (amount !== outputTotal) {
//       console.error(`Invalid transaction from ${address}`);

//       return false;
//     }

//     if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
//       console.error(`Invalid signature from ${address}`);
//       return false;
//     }

//     return true;
//   }

//   static rewardTransaction({ minerWallet }) {
//     return new this({
//       input: REWARD_INPUT,
//       outputMap: { [minerWallet.publicKey]: MINING_REWARD }
//     });
//   }
// };

// module.exports = Transaction;
// const uuid = require('uuid/v1');
// const { verifySignature } = require('../util');
// const { REWARD_INPUT, MINING_REWARD, VALIDATOR_REWARD_PERCENT, PLATFORM_FEE_PERCENT } = require('../config');

// class Transaction {
//   constructor({ senderWallet, recipient, amount, outputMap, input, iotData, sampleData, validatorApprovals, qualityScore }) {
//     this.id = uuid();
//     this.iotData = iotData || {};  // ✅ Stores IoT sensor data for produce quality
//     this.sampleData = sampleData || {};  // ✅ Stores on-site physical validation data
//     this.validatorApprovals = validatorApprovals || {};  // ✅ Keeps track of validator decisions
//     this.qualityScore = qualityScore || 0;  // ✅ AI-generated quality score
//     this.qualityDecision = "PENDING";  // ✅ AI or validator approval status

//     this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
//     this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
//   }

//   /**
//    * ✅ Creates an output map for payment distribution.
//    */
//   createOutputMap({ senderWallet, recipient, amount }) {
//     const outputMap = {};

//     // ✅ Calculate payment splits
//     const validatorReward = (amount * VALIDATOR_REWARD_PERCENT) / 100;
//     const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
//     const farmerAmount = amount - validatorReward - platformFee;

//     outputMap[recipient] = farmerAmount;  // ✅ Farmer receives their payment
//     outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    
//     return outputMap;
//   }

//   /**
//    * ✅ Creates input metadata for the transaction.
//    */
//   createInput({ senderWallet, outputMap }) {
//     return {
//       timestamp: Date.now(),
//       amount: senderWallet.balance,
//       address: senderWallet.publicKey,
//       signature: senderWallet.sign(outputMap)
//     };
//   }

//   /**
//    * ✅ Updates a transaction with additional validator approvals.
//    */
//   updateValidation({ validatorWallet, approval }) {
//     this.validatorApprovals[validatorWallet.publicKey] = approval;
//   }

//   /**
//    * ✅ Finalizes the transaction based on validator consensus.
//    */
//   finalizeTransaction() {
//     const approvals = Object.values(this.validatorApprovals);
//     const approvalCount = approvals.filter(a => a === "APPROVED").length;
//     const rejectionCount = approvals.filter(a => a === "REJECTED").length;

//     if (approvalCount > rejectionCount) {
//       this.qualityDecision = "APPROVED";
//     } else {
//       this.qualityDecision = "REJECTED";
//     }
//   }

//   /**
//    * ✅ Validates transaction integrity.
//    */
//   static validTransaction(transaction) {
//     const { input: { address, amount, signature }, outputMap } = transaction;

//     const outputTotal = Object.values(outputMap)
//       .reduce((total, outputAmount) => total + outputAmount);

//     if (amount !== outputTotal) {
//       console.error(`Invalid transaction from ${address}`);
//       return false;
//     }

//     if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
//       console.error(`Invalid signature from ${address}`);
//       return false;
//     }

//     return true;
//   }

//   /**
//    * ✅ Creates a reward transaction for miners.
//    */
//   static rewardTransaction({ minerWallet }) {
//     return new this({
//       input: REWARD_INPUT,
//       outputMap: { [minerWallet.publicKey]: MINING_REWARD }
//     });
//   }
// }

// module.exports = Transaction;
