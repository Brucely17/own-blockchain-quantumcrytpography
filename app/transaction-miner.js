// app/transaction-miner.js
const Transaction = require('../wallet/transaction');
const QualityCheck = require('../validators/quality-algorithm');
const { walletRegistry } = require('../wallet/walletRegistry'); 

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub, validatorPool, paymentProcessor }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
    this.validatorPool = validatorPool;
    this.paymentProcessor = paymentProcessor;
  }

  async mineTransactions() {
    const validTransactions = this.transactionPool.validTransactions();
    if (validTransactions.length === 0) {
      console.log('No approved transactions to mine. Mining halted.');
      return;
    }
    // Add the valid transactions as a new block.
    this.blockchain.addBlock({ data: validTransactions });
    this.pubsub.broadcastChain();
    // Process payments for each transaction.
    validTransactions.forEach(tx => this.processPayments(tx));
    // Clear transactions that have been mined.
    this.transactionPool.clearBlockchainTransactions({ chain:this.blockchain.chain });
  }

  processPayments(transaction) {
    const totalAmount = transaction.pricePerKg * transaction.quantity;
    const farmerShare = totalAmount * 0.85;
    const validatorShare = totalAmount * 0.10;
    const platformShare = totalAmount * 0.05;
    const distributionDetails = {
      transactionId: transaction.id,
      totalAmount,
      farmerShare,
      validatorShare,
      platformShare,
      timestamp: Date.now()
    };

    // Sign the distribution details with the platform wallet.
    // Assuming platformWallet has a sign method.
    const platformWallet = walletRegistry["PLATFORM_WALLET"];
    const signature = platformWallet ? platformWallet.sign(distributionDetails) : null;

    console.log(`Processing Payments for Transaction ${transaction.id}`);
    console.log(`  Total Amount: ${totalAmount}`);
    console.log(`  Farmer Share: ${farmerShare}`);
    console.log(`  Validator Share: ${validatorShare}`);
    console.log(`  Platform Fee: ${platformShare}`);

    // Update the farmer's wallet.
    const farmerWallet = walletRegistry[transaction.input.address];
    if (farmerWallet) {
      farmerWallet.balance += farmerShare;
      console.log(`Farmer (${farmerWallet.publicKey}) new balance: ${farmerWallet.balance}`);
    } else {
      console.warn("Farmer wallet not found in registry");
    }

    // Update validators' wallets (split validator share equally).
    const validatorIds = Object.keys(transaction.validatorApprovals || {});
    if (validatorIds.length > 0) {
      const perValidatorPayment = validatorShare / validatorIds.length;
      validatorIds.forEach(vid => {
        if (walletRegistry[vid]) {
          walletRegistry[vid].balance += perValidatorPayment;
          console.log(`Validator ${vid} new balance: ${walletRegistry[vid].balance}`);
        } else {
          console.warn(`Validator wallet ${vid} not found in registry`);
        }
      });
    }

    // Deduct the distributed amount (farmerShare + validatorShare) from the platform wallet.
    if (platformWallet) {
      platformWallet.balance -= (farmerShare + validatorShare);
      console.log(`Platform wallet new balance: ${platformWallet.balance}`);
    } else {
      console.warn("Platform wallet not found in registry");
    }

    // Optionally, you can store or broadcast the distributionDetails along with the signature.
    return { distributionDetails, signature };
  
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
