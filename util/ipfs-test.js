const IPFSHandler = require('./ipfs');
async function runTests() {
    const iotData = { temperature: 22.4, humidity: 55, freshness: 85 };
  
    const ipfsHash = await IPFSHandler.uploadJSON(iotData);
    console.log("🌍 IoT Data Stored at IPFS Hash:", ipfsHash);
  
    const data = await IPFSHandler.getJSON(ipfsHash);
    console.log("📥 Retrieved IoT Data:", data);

    const newData = await IPFSHandler.getFile(ipfsHash);
    console.log("📥 Retrieved IoT Data:", newData);


  }
  
  runTests();