// validators/quality-algorithm.js
const cryptoHash = require('../util/crypto-hash');

class QualityCheck {
  static evaluateQuality(iotData, sampleData, farmerId, pastTransactions = []) {
    if (!iotData || !sampleData) {
      console.error("Missing IoT or sample data.");
      return { qualityScore: 0, decision: "REJECT", reason: "Missing IoT or sample data." };
    }

    const weightage = {
      temperature: 0.3,
      humidity: 0.2,
      freshness: 0.5
    };

    let weightedScore = 0;
    for (let key in weightage) {
      if (iotData[key] !== undefined && sampleData[key] !== undefined) {
        const iotValue = Number(iotData[key]);
        const sampleValue = Number(sampleData[key]);
        const difference = Math.abs(iotValue - sampleValue);
        const matchScore = Math.max(0, 100 - (difference * 2));
        weightedScore += matchScore * weightage[key];
        console.log(`Key: ${key}, IoT: ${iotValue}, Sample: ${sampleValue}, Diff: ${difference}, MatchScore: ${matchScore}`);
      } else {
        console.warn(`Key ${key} missing in one of the datasets.`);
      }
    }

    const qualityScore = Math.round(weightedScore);
    console.log(`Computed weightedScore: ${weightedScore}, qualityScore: ${qualityScore}`);
    
    const fraudCheck = this.detectFarmerFraud(farmerId, pastTransactions);
    let decision, reason;
    if (fraudCheck.flagged) {
      decision = "REJECT";
      reason = fraudCheck.reason;
    } else if (qualityScore >= 85) {
      decision = "AUTO_APPROVE";
      reason = "IoT data closely matches physical sample.";
    } else if (qualityScore >= 50) {
      decision = "NEEDS_REVIEW";
      reason = "Moderate difference detected. More validator input needed.";
    } else {
      decision = "REJECT";
      reason = "Significant mismatch between IoT and sample data.";
    }
    console.log(`Quality Check Result: Score=${qualityScore}, Decision=${decision}, Reason=${reason}`);
    return { qualityScore, decision, reason };
  }

  static generateQualityHash(iotData, sampleData) {
    return cryptoHash(iotData, sampleData);
  }

  static detectFarmerFraud(farmerId, pastTransactions) {
    let rejectedCount = pastTransactions.filter(tx => tx.qualityDecision === "REJECT").length;
    let totalCount = pastTransactions.length;
    if (totalCount > 5 && (rejectedCount / totalCount) > 0.4) {
      console.warn(`Fraud Alert: Farmer ${farmerId} has a high rejection rate.`);
      return { flagged: true, reason: "Farmer has a high rejection rate." };
    }
    return { flagged: false };
  }

  static detectValidatorFraud(validatorId, pastValidations) {
    let approvedLowQuality = pastValidations.filter(validation => 
      validation.qualityScore < 50 && validation.approval === "APPROVED"
    ).length;
    let totalValidations = pastValidations.length;
    if (totalValidations > 10 && (approvedLowQuality / totalValidations) > 0.3) {
      console.warn(`Validator ${validatorId} flagged for approving low-quality produce.`);
      return { flagged: true, reason: "Validator is approving poor-quality produce too frequently." };
    }
    return { flagged: false };
  }
}

module.exports = QualityCheck;

// const cryptoHash = require('../util/crypto-hash');

// class QualityCheck {
//   /**
//    * ✅ Evaluates the quality of produce using IoT & validator sample data.
//    * - Returns a decision: "AUTO_APPROVE", "REJECT", or "NEEDS_REVIEW".
//    */
//   static evaluateQuality(iotData, sampleData) {
//     if (!iotData || !sampleData) {
//       return { qualityScore: 0, decision: "REJECT", reason: "Missing IoT or sample data." };
//     }

//     // ✅ Define weightage for IoT vs physical sample parameters
//     const weightage = {
//       temperature: 0.3,
//       humidity: 0.2,
//       freshness: 0.5
//     };

//     // ✅ Calculate differences between IoT readings & validator sample data
//     let totalDifference = 0;
//     let maxPossibleDifference = 0;
//     let weightedScore = 0;

//     for (let key in weightage) {
//       if (iotData[key] !== undefined && sampleData[key] !== undefined) {
//         const difference = Math.abs(iotData[key] - sampleData[key]);
//         totalDifference += difference * weightage[key];
//         maxPossibleDifference += 100 * weightage[key]; // Normalize to 100 scale

//         // ✅ If validator's physical data closely matches IoT data, increase score
//         const matchScore = Math.max(0, 100 - (difference * 2));
//         weightedScore += matchScore * weightage[key];
//       }
//     }

//     // ✅ Normalize score to 0-100 range
//     const qualityScore = Math.round(weightedScore);

//     // ✅ Decide whether to approve or reject based on quality score
//     let decision;
//     let reason;

//     if (qualityScore >= 80) {
//       decision = "AUTO_APPROVE";
//       reason = "IoT data closely matches physical verification.";
//     } else if (qualityScore >= 50) {
//       decision = "NEEDS_REVIEW";
//       reason = "Moderate difference detected. More validators needed.";
//     } else {
//       decision = "REJECT";
//       reason = "IoT data and physical sample mismatch is too high.";
//     }

//     return { qualityScore, decision, reason };
//   }

//   /**
//    * ✅ Generates a hash for quality data to prevent manipulation.
//    */
//   static generateQualityHash(iotData, sampleData) {
//     return cryptoHash(iotData, sampleData);
//   }

//   /**
//    * ✅ Compares historical data of a farmer to detect fraud patterns.
//    */
//   static detectFraudulentPatterns(farmerId, pastTransactions) {
//     let rejectedCount = pastTransactions.filter(tx => tx.qualityDecision === "REJECT").length;
//     let totalCount = pastTransactions.length;

//     if (totalCount > 5 && (rejectedCount / totalCount) > 0.4) {
//       return { flagged: true, reason: "Farmer has a high rejection rate." };
//     }

//     return { flagged: false };
//   }
// }

// module.exports = QualityCheck;
