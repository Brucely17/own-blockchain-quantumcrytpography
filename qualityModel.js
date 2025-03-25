// validators/advanced-quality-algorithm.js

const fs = require('fs');
const csv = require('csv-parser');
const math = require('mathjs');
const tf = require('@tensorflow/tfjs-node');

class QualityCheckAdvanced {
  // Utility: load CSV file into an array of objects.
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

  // Convert CSV data into a numeric matrix.
  static computeNumericMatrix(data) {
    const keys = Object.keys(data[0]);
    return data.map(row => keys.map(key => parseFloat(row[key])));
  }

  // Compute the aggregated mean vector for a numeric matrix.
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

  // Compute covariance matrix of the data.
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
    return math.divide(cov, numRows - 1);
  }

  // Calculate Mahalanobis distance between two vectors given a covariance matrix.
  static mahalanobisDistance(x, y, covMatrix) {
    const diff = math.subtract(x, y);
    const invCov = math.inv(covMatrix);
    const temp = math.multiply(diff, invCov);
    const distSq = math.multiply(temp, math.transpose(diff));
    return Math.sqrt(distSq);
  }

  // Build and train a simple autoencoder using TensorFlow.js.
  static async trainAutoencoder(dataMatrix) {
    const dataTensor = tf.tensor2d(dataMatrix);
    const numFeatures = dataTensor.shape[1];
    // Define a simple encoder–decoder architecture.
    const input = tf.input({ shape: [numFeatures] });
    const encoded = tf.layers.dense({ units: Math.max(1, Math.floor(numFeatures / 2)), activation: 'relu' }).apply(input);
    const decoded = tf.layers.dense({ units: numFeatures, activation: 'linear' }).apply(encoded);
    const autoencoder = tf.model({ inputs: input, outputs: decoded });
    autoencoder.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    await autoencoder.fit(dataTensor, dataTensor, { epochs: 50, batchSize: 32, verbose: 0 });
    return autoencoder;
  }

  // Compute the reconstruction error of the autoencoder on the data.
  static async computeReconstructionError(autoencoder, dataMatrix) {
    const dataTensor = tf.tensor2d(dataMatrix);
    const reconstructed = autoencoder.predict(dataTensor);
    const errorTensor = tf.losses.meanSquaredError(dataTensor, reconstructed);
    const error = (await errorTensor.data())[0];
    return error;
  }

  // Main function to evaluate quality.
  static async evaluateQuality(farmerCSV, validatorCSV, farmerId, pastTransactions = []) {
    // Load and parse CSV data.
    const farmerData = await this.loadCSV(farmerCSV);
    const validatorData = await this.loadCSV(validatorCSV);
    const farmerMatrix = this.computeNumericMatrix(farmerData);
    const validatorMatrix = this.computeNumericMatrix(validatorData);

    // Compute aggregated means.
    const farmerMean = this.computeAggregatedMean(farmerMatrix);
    const validatorMean = this.computeAggregatedMean(validatorMatrix);

    // Combine data to compute the covariance matrix.
    const combinedMatrix = farmerMatrix.concat(validatorMatrix);
    const covMatrix = this.computeCovarianceMatrix(combinedMatrix);

    // Calculate the statistical quality score using Mahalanobis distance.
    const qualityDistance = this.mahalanobisDistance(farmerMean, validatorMean, covMatrix);

    // Determine a decision based on the quality distance.
    let decision, reason;
    if (qualityDistance < 3) {
      decision = "AUTO_APPROVE";
      reason = "Farmer data statistically matches validator data.";
    } else if (qualityDistance < 6) {
      decision = "NEEDS_REVIEW";
      reason = "Farmer data moderately deviates from validator data.";
    } else {
      decision = "REJECT";
      reason = "Farmer data significantly deviates from validator data.";
    }

    // Anomaly detection using an autoencoder.
    // const autoencoder = await this.trainAutoencoder(farmerMatrix);
    const autoencoder= await tf.loadLayersModel('file://./my_autoencoder/model.json');
    const reconError = await this.computeReconstructionError(autoencoder, farmerMatrix);

    // If the reconstruction error is high, flag the data as anomalous.
    if (reconError > 0.05) { // This threshold should be calibrated using validation data.
      decision = "REJECT";
      reason += " Additionally, anomaly detection indicates inconsistencies in the farmer's data.";
    }

    console.log(`Quality Distance: ${qualityDistance.toFixed(3)}, Reconstruction Error: ${reconError.toFixed(4)}`);
    console.log(`Decision: ${decision} | Reason: ${reason}`);
    return { qualityScore: qualityDistance, decision, reason };
  }
}

module.exports = QualityCheckAdvanced;
