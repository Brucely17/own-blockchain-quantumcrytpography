const Transaction = require('../wallet/transaction');
const QualityCheck = require('../validators/quality-algorithm');

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub, validatorPool, paymentProcessor }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
    this.validatorPool = validatorPool;
    this.paymentProcessor = paymentProcessor;
  }

  mineTransactions() {
    const validTransactions = this.transactionPool.validTransactions();
    if (validTransactions.length === 0) {
      console.log('⚠️ No valid transactions meet approval requirements. Running AI Quality Check...');
      this.runAIQualityCheck();
      return;
    }
    // Add block to blockchain using the valid transactions
    this.blockchain.addBlock({ data: validTransactions });
    this.pubsub.broadcastChain();
    validTransactions.forEach(tx => this.processPayments(tx));
    this.transactionPool.clear();
  }

  runAIQualityCheck() {
    const rejectedTransactions = this.transactionPool.validTransactions().filter(tx => {
      const defaultValidatorCount = 3;
      const approvals = Object.keys(tx.validatorApprovals || {}).length;
      return approvals < Math.ceil(defaultValidatorCount / 2);
    });
    rejectedTransactions.forEach(tx => {
      const qualityResult = QualityCheck.evaluateQuality(tx.iotData, tx.sampleData, tx.input.address, []);
      if (qualityResult.decision === "AUTO_APPROVE") {
        console.log(`🤖 AI Decision: Transaction ${tx.id} auto-approved.`);
        this.finalizeTransaction(tx, "APPROVED");
      } else {
        console.log(`❌ AI Decision: Transaction ${tx.id} rejected.`);
        this.finalizeTransaction(tx, "REJECTED");
      }
    });
  }

  finalizeTransaction(transaction, status) {
    transaction.qualityDecision = status;
    if (status === "APPROVED" || status === "AI_APPROVED") {
      this.blockchain.addBlock({ data: [transaction] });
      console.log(`✅ Finalized and added transaction ${transaction.id} to the blockchain.`);
      this.pubsub.broadcastChain();
      this.transactionPool.clearBlockchainTransactions({ chain: this.blockchain.chain });
      this.processPayments(transaction);
    } else {
      console.log(`❌ Transaction ${transaction.id} marked as REJECTED.`);
    }
  }

  processPayments(transaction) {
    // Use transaction.pricePerKg and transaction.quantity for payment calculation.
    const totalAmount = transaction.pricePerKg * transaction.quantity;
    const farmerShare = totalAmount * 0.85;
    const validatorShare = totalAmount * 0.10;
    const platformShare = totalAmount * 0.05;
    console.log(`💰 Processing Payments for Transaction ${transaction.id}`);
    console.log(`   - Farmer: ${farmerShare} tokens`);
    console.log(`   - Validators: ${validatorShare} tokens`);
    console.log(`   - Platform: ${platformShare} tokens`);
    if (this.paymentProcessor) {
      this.paymentProcessor.processPayment({
        transactionId: transaction.id,
        farmerId: transaction.recipient, // Assuming recipient is the farmer
        amount: farmerShare,
        validatorPayments: this.calculateValidatorPayments(transaction, validatorShare),
        platformAmount: platformShare
      });
    }
  }

  calculateValidatorPayments(transaction, totalValidatorShare) {
    const validatorIds = Object.keys(transaction.validatorApprovals || {});
    const perValidatorPayment = validatorIds.length > 0 ? totalValidatorShare / validatorIds.length : 0;
    return validatorIds.map(validatorId => ({
      validatorId,
      amount: perValidatorPayment
    }));
  }
}

module.exports = TransactionMiner;


// const Transaction = require('../wallet/transaction');

// class TransactionMiner {

//   constructor({ blockchain, transactionPool, wallet, pubsub }) {
//     this.blockchain = blockchain;
//     this.transactionPool = transactionPool;
//     this.wallet = wallet;
//     this.pubsub = pubsub;
//   }


//   mineTransactions() {
//     const validTransactions = this.transactionPool.validTransactions();

//     // validTransactions.push(

//     //   Transaction.rewardTransaction({ minerWallet: this.wallet })
      
//     // );

//     this.blockchain.addBlock({ data: validTransactions });

//     this.pubsub.broadcastChain();

//     this.transactionPool.clear();
//   }
// }


// module.exports = TransactionMiner;







// const Transaction = require('../wallet/transaction');
// const QualityCheck = require('../validators/quality-algorithm'); // ✅ AI-Based Quality Check

// class TransactionMiner {
//   constructor({ blockchain, transactionPool, wallet, pubsub, validatorPool, paymentProcessor }) {
//     this.blockchain = blockchain;
//     this.transactionPool = transactionPool;
//     this.wallet = wallet;
//     this.pubsub = pubsub;
//     this.validatorPool = validatorPool;
//     this.paymentProcessor = paymentProcessor;
//   }

//   mineTransactions() {
//     const validTransactions = this.transactionPool.validTransactions().filter(tx => {
//       const approvals = Object.keys(tx.validatorApprovals || {}).length;
//       return approvals >= Math.ceil(Object.keys(this.validatorPool.validators).length / 2); // ✅ Require 50%+ validator approval
//     });

//     if (validTransactions.length === 0) {
//       console.log('No transactions meet PoQ requirements. Running AI Quality Check...');
//       return this.runAIQualityCheck();
//     }

//     // ✅ Aggregate quality scores for the block
//     const totalQualityScore = validTransactions.reduce((sum, tx) => sum + tx.qualityScore, 0);
//     const averageQualityScore = totalQualityScore / validTransactions.length;

//     // ✅ Store validation records & IoT data on the blockchain
//     const verifiedData = validTransactions.map(tx => ({
//       farmerId: tx.farmerId,
//       pricePerKg: tx.pricePerKg,
//       quantity: tx.quantity,
//       iotDataIPFS: tx.iotDataIPFS, // ✅ IoT data reference from IPFS
//       validationFiles: tx.validatorApprovals, // ✅ Physical validation reports
//       finalStatus: 'Approved',
//       qualityScore: tx.qualityScore
//     }));

//     // ✅ Mine a new block with validated transactions
//     this.blockchain.addBlock({ data: verifiedData, qualityScore: averageQualityScore });

//     // ✅ Broadcast the updated blockchain to all nodes
//     this.pubsub.broadcastChain();

//     // ✅ Process payments to farmers & validators
//     verifiedData.forEach(tx => this.processPayments(tx));

//     // ✅ Clear transaction pool after mining
//     this.transactionPool.clear();
//   }

//   /**
//    * ✅ Runs AI-based Quality Check when validators fail to approve.
//    */
//   runAIQualityCheck() {
//     const rejectedTransactions = this.transactionPool.validTransactions().filter(tx => {
//       const approvals = Object.keys(tx.validatorApprovals || {}).length;
//       return approvals < Math.ceil(Object.keys(this.validatorPool.validators).length / 2);
//     });

//     rejectedTransactions.forEach(tx => {
//       const qualityResult = QualityCheck.evaluateQuality(tx.iotData, tx.sampleData);

//       if (qualityResult.decision === "AUTO_APPROVE") {
//         console.log(`AI Decision: Transaction ${tx.id} auto-approved due to strong IoT Quality.`);
//         this.finalizeTransaction(tx, "APPROVED");
//       } else {
//         console.log(`AI Decision: Transaction ${tx.id} rejected due to quality mismatch.`);
//         this.finalizeTransaction(tx, "REJECTED");
//       }
//     });
//   }

//   /**
//    * ✅ Finalizes the transaction and adds it to the blockchain.
//    */
//   finalizeTransaction(transaction, status) {
//     transaction.qualityDecision = status;

//     if (status === "APPROVED") {
//       this.blockchain.addBlock({ data: transaction, qualityScore: transaction.qualityScore });
//       this.pubsub.broadcastChain();
//       this.transactionPool.clearBlockchainTransactions({ chain: this.blockchain.chain });

//       // ✅ Process Payments
//       this.processPayments(transaction);
//     }
//   }

//   /**
//    * ✅ Splits payments between farmer, validators, and platform provider.
//    */
//   processPayments(transaction) {
//     const totalAmount = transaction.pricePerKg * transaction.quantity;
//     const farmerShare = totalAmount * 0.85;  // ✅ 85% to Farmer
//     const validatorShare = totalAmount * 0.10;  // ✅ 10% to Validators
//     const platformShare = totalAmount * 0.05;  // ✅ 5% to Platform

//     // ✅ Distribute payments to farmer
//     this.paymentProcessor.processPayment({
//       transactionId: transaction.id,
//       farmerId: transaction.farmerId,
//       amount: farmerShare,
//       validatorPayments: this.calculateValidatorPayments(transaction, validatorShare),
//       platformAmount: platformShare
//     });
//   }

//   /**
//    * ✅ Calculates payments for validators based on reputation.
//    */
//   calculateValidatorPayments(transaction, totalValidatorShare) {
//     const validatorCount = Object.keys(transaction.validatorApprovals).length;
//     const perValidatorPayment = totalValidatorShare / validatorCount;

//     return Object.keys(transaction.validatorApprovals).map(validatorId => ({
//       validatorId,
//       amount: perValidatorPayment + (this.validatorPool.validators[validatorId].reputation * 0.01) // ✅ Higher reputation = higher bonus
//     }));
//   }
// }

// module.exports = TransactionMiner;
