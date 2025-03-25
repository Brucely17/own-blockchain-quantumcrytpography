const fs = require('fs');
const csv = require('csv-parser');  // Utility if CSV loading is needed.
const math = require('mathjs');
const tf = require('@tensorflow/tfjs-node');
const cryptoHash = require('../util/crypto-hash');

class QualityCheck {
  /**
   * Utility: Load CSV file into an array of objects.
   */
  static async loadCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Converts CSV data (an array of objects) into a numeric matrix.
   * Assumes all rows have the same keys.
   * @param {Array<Object>} data 
   * @returns {Array<Array<number>>}
   */
  static computeNumericMatrix(data) {
    const keys = Object.keys(data[0]);
    return data.map(row => keys.map(key => parseFloat(row[key])));
  }

  /**
   * Aggregates an array of objects by computing the mean for each key,
   * but only uses rows that have valid numeric values for all keys.
   * @param {Array<Object>} dataArr 
   * @returns {Object|null} Aggregated data or null if no valid rows.
   */
  static aggregateData(dataArr) {
    const keys = Object.keys(dataArr[0]);
    // Filter rows: include only if every key exists and is a valid number (non-empty)
    const validRows = dataArr.filter(row =>
      keys.every(key => row[key] !== "" && !isNaN(Number(row[key])))
    );
    if (validRows.length === 0) return null;
    const sumObj = {};
    keys.forEach(key => { sumObj[key] = 0; });
    validRows.forEach(row => {
      keys.forEach(key => {
        sumObj[key] += Number(row[key]);
      });
    });
    const meanObj = {};
    keys.forEach(key => {
      meanObj[key] = sumObj[key] / validRows.length;
    });
    return meanObj;
  }

  static computeAggregatedMean(matrix) {
    const numRows = matrix.length;
    const numCols = matrix[0].length;
    const meanVector = [];
    for (let j = 0; j < numCols; j++) {
      let sum = 0;
      for (let i = 0; i < numRows; i++) {
        sum += matrix[i][j];
      }
      meanVector.push(sum / numRows);
    }
    return meanVector;
  }

  static computeCovarianceMatrix(matrix) {
    const numRows = matrix.length;
    const numCols = matrix[0].length;
    const means = this.computeAggregatedMean(matrix);
    let cov = math.zeros(numCols, numCols);
    for (let i = 0; i < numRows; i++) {
      const row = matrix[i];
      const diff = row.map((val, j) => val - means[j]);
      for (let j = 0; j < numCols; j++) {
        for (let k = 0; k < numCols; k++) {
          cov.set([j, k], cov.get([j, k]) + diff[j] * diff[k]);
        }
      }
    }
    cov = math.divide(cov, numRows - 1);
    // Regularization: add a small epsilon identity matrix to avoid singularity.
    const epsilon = 1e-6;
    const identity = math.identity(numCols);
    cov = math.add(cov, math.multiply(identity, epsilon));
    return cov;
  }

  static mahalanobisDistance(x, y, covMatrix) {
    const diff = math.subtract(x, y);
    const invCov = math.inv(covMatrix);
    const temp = math.multiply(diff, invCov);
    const distSq = math.multiply(temp, math.transpose(diff));
    return Math.sqrt(distSq);
  }

  /**
   * Computes the reconstruction error of the pretrained autoencoder on the given IoT data.
   * Converts iotData (a JSON object) into a numeric vector.
   * @param {tf.LayersModel} model - Pretrained autoencoder.
   * @param {Object} iotData - Farmer's IoT data.
   * @returns {Promise<number>} Mean squared error.
   */
  static async computeReconstructionErrorPretrained(model, iotData) {
    const inputArray = Object.values(iotData).map(val => Number(val));
    const dataTensor = tf.tensor2d([inputArray]); // shape [1, numFeatures]
    const reconstructed = model.predict(dataTensor);
    const errorTensor = tf.losses.meanSquaredError(dataTensor, reconstructed);
    const error = (await errorTensor.data())[0];
    return error;
  }

  /**
   * Main function to evaluate quality.
   * Accepts either a JSON object or an array of objects for iotData and sampleData.
   * Aggregates if needed, computes Mahalanobis distance and loads a pretrained autoencoder 
   * to calculate reconstruction error, then combines these into a final quality score.
   * @param {Object|Array} iotDataInput - Farmer's IoT data.
   * @param {Object|Array} sampleDataInput - Validator's physical sample data.
   * @param {string} farmerId - Farmer identifier.
   * @param {Array} pastTransactions - Past transactions for fraud detection.
   * @returns {Promise<Object>} { qualityScore, decision, reason }
   */
  static async evaluateQuality(iotDataInput, sampleDataInput, farmerId, pastTransactions = []) {
    // If data is an array, aggregate it.
    const iotData = Array.isArray(iotDataInput) ? this.aggregateData(iotDataInput) : iotDataInput;
    const sampleData = Array.isArray(sampleDataInput) ? this.aggregateData(sampleDataInput) : sampleDataInput;

    if (!iotData || !sampleData) {
      console.error("Missing IoT or sample data.");
      return { qualityScore: 0, decision: "REJECT", reason: "Missing IoT or sample data." };
    }

    // Compute common keys.
    const commonKeys = Object.keys(iotData).filter(key => sampleData.hasOwnProperty(key));
    if (commonKeys.length === 0) {
      console.error("No common data dimensions found.");
      return { qualityScore: 0, decision: "REJECT", reason: "Mismatched data dimensions." };
    }

    const iotValues = commonKeys.map(key => Number(iotData[key]));
    const sampleValues = commonKeys.map(key => Number(sampleData[key]));
    console.log("Common Keys:", commonKeys);
    console.log("IoT Values:", iotValues, "Sample Values:", sampleValues);

    if (iotValues.length !== sampleValues.length) {
      console.error("Mismatched data dimensions.");
      return { qualityScore: 0, decision: "REJECT", reason: "Mismatched data dimensions." };
    }

    // Create a 2-row matrix for covariance calculation.
    const combinedMatrix = [iotValues, sampleValues];
    const covMatrix = this.computeCovarianceMatrix(combinedMatrix);
    const qualityDistance = this.mahalanobisDistance(iotValues, sampleValues, covMatrix);
    console.log(`Mahalanobis Distance: ${qualityDistance.toFixed(3)}`);

    // Load pretrained autoencoder model.
    const model = await tf.loadLayersModel('file://./my_autoencoder/model.json');
    const reconError = await this.computeReconstructionErrorPretrained(model, iotData);
    console.log(`Reconstruction Error: ${reconError.toFixed(4)}`);

    // Combine metrics: final quality score = Mahalanobis distance + (reconstruction error * scalingFactor)
    const scalingFactor = 20;
    const combinedScore = qualityDistance + (reconError * scalingFactor);
    const qualityScore = Math.round(combinedScore/10);
    console.log(`Combined Quality Score: ${qualityScore}`);

    // Decision thresholds.
    let decision, reason;
    if (qualityScore < 5) {
      decision = "AUTO_APPROVE";
      reason = "Farmer data strongly matches validator data.";
    } else if (qualityScore < 10) {
      decision = "NEEDS_REVIEW";
      reason = "Farmer data moderately deviates from validator data.";
    } else {
      decision = "REJECT";
      reason = "Farmer data significantly deviates from validator data.";
    }

    // Fraud detection.
    const fraudCheck = this.detectFarmerFraud(farmerId, pastTransactions);
    if (fraudCheck.flagged) {
      decision = "REJECT";
      reason = fraudCheck.reason;
    }

    console.log(`Final Decision: ${decision} | Reason: ${reason}`);
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
