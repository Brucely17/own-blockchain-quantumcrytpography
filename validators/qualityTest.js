// example-advanced-quality.js
const QualityCheckAdvanced = require('./quality-algorithm');
const tf = require('@tensorflow/tfjs-node');

(async () => {
  const farmerId = 'FARMER_001';

  // Example: assume we already have JSON data from CSV conversion.
  // Here, each input is a plain object with aggregated (mean) values.
  const farmerIotData = {
    temperature: "30.84",
    humidity: "85.01",
    ambient_light: "2151.2",
    soil_moisture: "38.29",
    ethylene_ppb: "1.74",
    CO2_ppm: "764.73"
  };

  const validatorSampleData = {
    temperature: "29.22",
    humidity: "72.57",
    ambient_light: "6491.18",
    soil_moisture: "22.13",
    ethylene_ppb: "2.76",
    CO2_ppm: "562.38"
  };

  try {
    const result = await QualityCheckAdvanced.evaluateQuality(farmerIotData, validatorSampleData, farmerId);
    console.log('Evaluation Result:', result);
  } catch (error) {
    console.error('Error during evaluation:', error);
  }
})();
