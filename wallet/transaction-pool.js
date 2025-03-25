// wallet/transaction-pool.js
const QualityCheck = require('../validators/quality-algorithm');

class TransactionPool {
  constructor() {
    this.transactionMap = {};
    this.rejectedTransactions = {};
    this.validatorStakedTransactions = {};
  }

  clear() {
    this.transactionMap = {};
    this.validatorStakedTransactions = {};
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap) {
    this.transactionMap = transactionMap;
  }

  existingTransaction({ inputAddress }) {
    return Object.values(this.transactionMap).find(tx => tx.input.address === inputAddress);
  }

  // Return only transactions that have a final qualityDecision.
  validTransactions() {
    return Object.values(this.transactionMap).filter(transaction => {
      return transaction.qualityDecision === "APPROVED" || transaction.qualityDecision === "AI_APPROVED";
    });
  }

  rejectTransaction(transaction) {
    this.rejectedTransactions[transaction.id] = transaction;
    delete this.transactionMap[transaction.id];
    console.log(`Transaction ${transaction.id} rejected & stored for AI review.`);
  }

  stakeValidatorTransaction(transactionId, validatorId) {
    if (!this.rejectedTransactions[transactionId]) {
      console.log(`Transaction ${transactionId} not found in rejected list.`);
      return;
    }
    this.validatorStakedTransactions[transactionId] = validatorId;
    this.setTransaction(this.rejectedTransactions[transactionId]);
    delete this.rejectedTransactions[transactionId];
    console.log(`Validator ${validatorId} staked approval for Transaction ${transactionId}`);
  }

  revalidateRejectedTransactions(qualityCheck) {
    Object.values(this.rejectedTransactions).forEach(transaction => {
      if (this.validatorStakedTransactions[transaction.id]) {
        console.log(`Validator override: Transaction ${transaction.id} approved.`);
        this.setTransaction(transaction);
        delete this.rejectedTransactions[transaction.id];
        return;
      }
      const qualityResult = qualityCheck.evaluateQuality(
        transaction.iotData,
        transaction.sampleData,
        transaction.input.address,
        []
      );
      console.log(qualityResult, " transaction pool code")
      if (qualityResult.decision === "AUTO_APPROVE") {
        console.log(`AI Auto-Approved Transaction ${transaction.id}`);
        this.setTransaction(transaction);
        delete this.rejectedTransactions[transaction.id];
      } else {
        console.log(`Transaction ${transaction.id} remains rejected.`);
      }
    });
  }

  clearBlockchainTransactions({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }
}

module.exports = TransactionPool;


// const Transaction = require('./transaction');

// class TransactionPool {
//   constructor() {
//     this.transactionMap = {};
//   }

//   clear() {
//     this.transactionMap = {};
//   }

//   setTransaction(transaction) {
//     this.transactionMap[transaction.id] = transaction;
//   }

//   setMap(transactionMap) {
//     this.transactionMap = transactionMap;
//   }

//   existingTransaction({ inputAddress }) {

//     const transactions = Object.values(this.transactionMap);

//     return transactions.find(transaction => transaction.input.address === inputAddress);
    
//   }

//   validTransactions() {
//     return Object.values(this.transactionMap).filter(
//       transaction => Transaction.validTransaction(transaction)
//     );
//   }

//   clearBlockchainTransactions({ chain }) {
//     for (let i=1; i<chain.length; i++) {
//       const block = chain[i];

//       for (let transaction of block.data) {
//         if (this.transactionMap[transaction.id]) {
//           delete this.transactionMap[transaction.id];
//         }
//       }
//     }
//   }
// }

// module.exports = TransactionPool;
// class TransactionPool {
//   constructor() {
//     this.transactionMap = {};
//     this.rejectedTransactions = {}; // ✅ Stores rejected transactions for re-evaluation
//   }

//   /**
//    * ✅ Clears the transaction pool.
//    */
//   clear() {
//     this.transactionMap = {};
//   }

//   /**
//    * ✅ Adds a new transaction to the pool.
//    */
//   setTransaction(transaction) {
//     this.transactionMap[transaction.id] = transaction;
//   }

//   /**
//    * ✅ Sets the entire transaction pool map.
//    */
//   setMap(transactionMap) {
//     this.transactionMap = transactionMap;
//   }

//   /**
//    * ✅ Checks if a transaction already exists from the sender.
//    */
//   existingTransaction({ inputAddress }) {
//     return Object.values(this.transactionMap).find(tx => tx.input.address === inputAddress);
//   }

//   /**
//    * ✅ Returns only transactions that meet PoQ requirements:
//    * - 50%+ validator approvals OR
//    * - AI Quality Score auto-approval.
//    */
//   validTransactions() {
//     return Object.values(this.transactionMap).filter(transaction => {
//       const approvals = Object.keys(transaction.validatorApprovals || {}).length;
//       return approvals >= Math.ceil(Object.keys(transaction.validatorPool || {}).length / 2) || 
//              transaction.qualityDecision === "AUTO_APPROVE";
//     });
//   }

//   /**
//    * ✅ Moves rejected transactions to a separate list.
//    */
//   rejectTransaction(transaction) {
//     this.rejectedTransactions[transaction.id] = transaction;
//     delete this.transactionMap[transaction.id];
//     console.log(`Transaction ${transaction.id} rejected & stored for review.`);
//   }

//   /**
//    * ✅ Re-evaluates rejected transactions using AI Quality Check.
//    */
//   revalidateRejectedTransactions(qualityCheck) {
//     Object.values(this.rejectedTransactions).forEach(transaction => {
//       const qualityResult = qualityCheck.evaluateQuality(transaction.iotData, transaction.sampleData);
      
//       if (qualityResult.decision === "AUTO_APPROVE") {
//         console.log(`AI has auto-approved transaction ${transaction.id}`);
//         this.setTransaction(transaction);
//         delete this.rejectedTransactions[transaction.id];
//       } else {
//         console.log(`Transaction ${transaction.id} remains rejected.`);
//       }
//     });
//   }

//   /**
//    * ✅ Clears transactions that have already been added to the blockchain.
//    */
//   clearBlockchainTransactions({ chain }) {
//     for (let i = 1; i < chain.length; i++) {
//       const block = chain[i];

//       for (let transaction of block.data) {
//         if (this.transactionMap[transaction.id]) {
//           delete this.transactionMap[transaction.id];
//         }
//       }
//     }
//   }
// }

// // ✅ Removed Unused Import
// module.exports = TransactionPool;
