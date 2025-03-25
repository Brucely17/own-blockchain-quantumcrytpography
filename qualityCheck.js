import QualityCheckAdvanced from './qualityModel.js';
import tf from '@tensorflow/tfjs-node';

// async function trainAndSaveModel(datasetCSV) {
//   // Load your dataset
//   const data = await QualityCheckAdvanced.loadCSV(datasetCSV);
//   const dataMatrix = QualityCheckAdvanced.computeNumericMatrix(data);
  
//   // Train the autoencoder
//   const autoencoder = await QualityCheckAdvanced.trainAutoencoder(dataMatrix);
  
//   // Save the autoencoder to disk
//   await autoencoder.save('file://./my_autoencoder');

//   console.log('Model saved.');
  
//   return autoencoder;
// }

// Example usage:
const farmerCSV = 'test2.csv';
const validatorCSV = 'test1.csv';
const farmerId = 'FARMER_001';

// Train and save the autoencoder first.
// trainAndSaveModel(farmerCSV)
//   .then(async () => {
//     // After saving, load the model for prediction:
//     const model = await tf.loadLayersModel('file://./my_autoencoder/model.json');

//     console.log('Model loaded for prediction.');
    
    // Run quality evaluation
    QualityCheckAdvanced.evaluateQuality(farmerCSV, validatorCSV, farmerId)
      .then(result => console.log('Evaluation Result:', result))
      .catch(error => console.error('Error during evaluation:', error));
//   })

//   .catch(error => {
//     console.error('Error during training/saving:', error);
//   });
