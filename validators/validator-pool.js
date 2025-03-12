class ValidatorPool {
  constructor() {
    this.validators = {}; // Stores validators and their stats
  }
  
  registerValidator(validatorId) {
    if (!this.validators[validatorId]) {
      this.validators[validatorId] = {
        reputation: 100,
        assignedTransactions: 0,
        totalApprovals: 0,
        totalRejections: 0
      };
      console.log(`✅ Validator ${validatorId} registered with reputation 100.`);
      return true;
    }
    return false;
  }
  
  selectValidators(transactionId, count = 3) {
    const sortedValidators = Object.keys(this.validators)
      .sort((a, b) => {
        const repDiff = this.validators[b].reputation - this.validators[a].reputation;
        if (repDiff === 0) {
          return this.validators[a].assignedTransactions - this.validators[b].assignedTransactions;
        }
        return repDiff;
      });
    const selectedValidators = sortedValidators.slice(0, count);
    selectedValidators.forEach(validator => {
      this.validators[validator].assignedTransactions += 1;
    });
    console.log(`🔍 Selected Validators for Transaction ${transactionId}: ${selectedValidators}`);
    return selectedValidators;
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
      console.warn(`⚠️ Validator ${validatorId} removed due to low reputation.`);
      delete this.validators[validatorId];
    }
    console.log(`🔄 Validator ${validatorId} reputation updated to ${this.validators[validatorId]?.reputation}`);
  }
  
  detectValidatorFraud(validatorId, pastValidations) {
    let approvedLowQuality = pastValidations.filter(validation => 
      validation.qualityScore < 50 && validation.approval === "APPROVED"
    ).length;
    let totalValidations = pastValidations.length;
    if (totalValidations > 10 && (approvedLowQuality / totalValidations) > 0.3) {
      console.warn(`⚠️ Validator ${validatorId} flagged for approving low-quality produce.`);
      return { flagged: true, reason: "Validator is approving poor-quality produce too frequently." };
    }
    return { flagged: false };
  }
  
  getActiveValidators() {
    return Object.keys(this.validators);
  }

  syncValidatorPool(newPool) {
    this.validators = { ...newPool };
    console.log(`🔄 Validator Pool Synchronized with Network.`);
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
  