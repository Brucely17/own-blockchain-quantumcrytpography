// validators/validator-pool.js
const MAX_QUEUE_LENGTH = 3;

class ValidatorPool {
  constructor() {
    this.validators = {}; // { validatorId: { reputation, assignedTransactions, transactionQueue, ... } }
  }
  
  registerValidator(validatorId) {
    if (!this.validators[validatorId]) {
      this.validators[validatorId] = {
        reputation: 100,
        assignedTransactions: 0,
        totalApprovals: 0,
        totalRejections: 0,
        transactionQueue: []
      };
      console.log(`Validator ${validatorId} registered with reputation 100.`);
      return true;
    }
    return false;
  }
  
  // Assign transaction to up to 'count' validators.
  assignTransaction(transaction, count = 3) {
    // Sort validators by reputation (descending) and queue length (ascending)
    const sorted = Object.entries(this.validators).sort(([, a], [, b]) => {
      const repDiff = b.reputation - a.reputation;
      if (repDiff === 0) {
        const lenA = Array.isArray(a.transactionQueue) ? a.transactionQueue.length : 0;
        const lenB = Array.isArray(b.transactionQueue) ? b.transactionQueue.length : 0;
        return lenA - lenB;
      }
      return repDiff;
    });
    
    const assigned = [];
    for (const [validatorId, info] of sorted) {
      if (Array.isArray(info.transactionQueue) && info.transactionQueue.length < MAX_QUEUE_LENGTH) {
        info.transactionQueue.push(transaction.id);
        info.assignedTransactions++;
        assigned.push(validatorId);
        if (assigned.length === count) break;
      }
    }
    if (assigned.length === 0) {
      console.warn(`All validator queues are full for transaction ${transaction.id}.`);
      return null;
    }
    console.log(`Transaction ${transaction.id} assigned to validators: ${assigned}`);
    return assigned;
  }
  
  removeTransactionFromQueue(validatorId, transactionId) {
    if (this.validators[validatorId] && Array.isArray(this.validators[validatorId].transactionQueue)) {
      const queue = this.validators[validatorId].transactionQueue;
      const idx = queue.indexOf(transactionId);
      if (idx !== -1) queue.splice(idx, 1);
    }
  }
  
  updateReputation(validatorId, isAccurate) {
    if (!this.validators[validatorId]) return;
    if (isAccurate) {
      this.validators[validatorId].reputation += 5;
      this.validators[validatorId].totalApprovals += 1;
    } else {
      this.validators[validatorId].reputation -= 10;
      this.validators[validatorId].totalRejections += 1;
    }
    this.validators[validatorId].reputation = Math.max(0, Math.min(200, this.validators[validatorId].reputation));
    if (this.validators[validatorId].reputation < 20) {
      console.warn(`Validator ${validatorId} removed due to low reputation.`);
      delete this.validators[validatorId];
    }
    console.log(`Validator ${validatorId} reputation updated to ${this.validators[validatorId]?.reputation}`);
  }
  
  getActiveValidators() {
    return Object.keys(this.validators);
  }

  syncValidatorPool(newPool) {
    this.validators = { ...newPool };
    console.log(`Validator Pool Synchronized with Network.`);
  }
}

module.exports = ValidatorPool;


// class ValidatorPool {
//     constructor() {
//       this.validators = {}; // ✅ Stores all validators and their reputation scores
//     }
  
//     /**
//      * ✅ Registers a new validator with default reputation.
//      */
//     registerValidator(validatorId) {
//       if (!this.validators[validatorId]) {
//         this.validators[validatorId] = { reputation: 100, assignedTransactions: 0 };
//         console.log(`Validator ${validatorId} registered with reputation 100.`);
//       }
//     }
  
//     /**
//      * ✅ Automatically selects validators based on reputation.
//      * - High-reputation validators have higher chances.
//      */
//     selectValidators(transactionId, count = 3) {
//       const sortedValidators = Object.keys(this.validators)
//         .sort((a, b) => this.validators[b].reputation - this.validators[a].reputation);
  
//       const selectedValidators = sortedValidators.slice(0, count);
  
//       selectedValidators.forEach(validator => {
//         this.validators[validator].assignedTransactions += 1;
//       });
  
//       console.log(`Selected Validators for Transaction ${transactionId}: ${selectedValidators}`);
//       return selectedValidators;
//     }
  
//     /**
//      * ✅ Updates validator reputation based on accuracy.
//      */
//     updateReputation(validatorId, isAccurate) {
//       if (!this.validators[validatorId]) return;
  
//       if (isAccurate) {
//         this.validators[validatorId].reputation += 5; // ✅ Reward for accurate validation
//       } else {
//         this.validators[validatorId].reputation -= 10; // ❌ Penalty for incorrect validation
//       }
  
//       // Ensure reputation remains between 0 - 200
//       this.validators[validatorId].reputation = Math.max(0, Math.min(200, this.validators[validatorId].reputation));
  
//       console.log(`Validator ${validatorId} reputation updated to ${this.validators[validatorId].reputation}`);
//     }
//   }
  
// module.exports = ValidatorPool;
  