// ✅ Create a promise that resolves to the IPFS instance
const ipfsPromise = (async () => {
    const { create } = await import('kubo-rpc-client');
    return create({ url: 'http://127.0.0.1:5001' }); // ✅ Connects to local IPFS node
})();

class IPFSHandler {
  /**
   * ✅ Uploads JSON data to IPFS and returns a hash.
   * - Used for IoT data, transaction metadata, validator reports.
   */
  static async uploadJSON(data) {
    try {
      const ipfs = await ipfsPromise; // ✅ Ensure IPFS is ready
      const { path } = await ipfs.add(JSON.stringify(data));
      console.log(`📡 JSON Data uploaded to IPFS: ${path}`);
      return path; // ✅ Returns the IPFS hash
    } catch (error) {
      console.error("❌ IPFS JSON Upload Error:", error);
      throw error;
    }
  }

  /**
   * ✅ Retrieves JSON data from IPFS using a given hash.
   */
  static async getJSON(ipfsHash) {
    try {
      const ipfs = await ipfsPromise; // ✅ Ensure IPFS is ready
      const stream = ipfs.cat(ipfsHash);
      let data = '';
      for await (const chunk of stream) {
        data += chunk.toString();
      }
      console.log(`📥 Retrieved JSON Data from IPFS: ${ipfsHash}`);
      return JSON.parse(data); // ✅ Converts back to JSON
    } catch (error) {
      console.error("❌ IPFS JSON Fetch Error:", error);
      throw error;
    }
  }

  /**
   * ✅ Uploads a file (Validator Reports, Produce Certificates, etc.).
   * - Returns the IPFS hash of the uploaded file.
   */
  static async uploadFile(buffer) {
    try {
      const ipfs = await ipfsPromise; // ✅ Ensure IPFS is ready
      const { path } = await ipfs.add(buffer);
      console.log(`📡 File uploaded to IPFS: ${path}`);
      return path; // ✅ Returns the IPFS hash
    } catch (error) {
      console.error("❌ IPFS File Upload Error:", error);
      throw error;
    }
  }

  /**
   * ✅ Retrieves a file from IPFS using its hash.
   * - Returns the file buffer.
   */
  static async getFile(ipfsHash) {
    try {
      const ipfs = await ipfsPromise; // ✅ Ensure IPFS is ready
      const stream = ipfs.cat(ipfsHash);
      let buffer = [];
      for await (const chunk of stream) {
        buffer.push(chunk);
      }
      console.log(`📥 Retrieved File from IPFS: ${ipfsHash}`);
      return Buffer.concat(buffer); // ✅ Returns the file buffer
    } catch (error) {
      console.error("❌ IPFS File Fetch Error:", error);
      throw error;
    }
  }

  /**
   * ✅ Verifies if a file exists in IPFS by fetching its content.
   * - Returns `true` if the file exists, otherwise `false`.
   */
  static async verifyFile(ipfsHash) {
    try {
      await IPFSHandler.getFile(ipfsHash); // ✅ Attempt to fetch the file
      console.log(`✅ File verified on IPFS: ${ipfsHash}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ File NOT found on IPFS: ${ipfsHash}`);
      return false;
    }
  }

  /**
   * ✅ Validates transaction data integrity before adding to blockchain.
   * - Ensures that IoT data and validator reports exist in IPFS before approval.
   */
  static async validateTransactionData(transaction) {
    if (!transaction.iotData || !transaction.sampleData) {
      return { valid: false, reason: "Missing IoT or sample data in transaction." };
    }

    const iotDataExists = await IPFSHandler.verifyFile(transaction.iotData);
    const sampleDataExists = await IPFSHandler.verifyFile(transaction.sampleData);

    if (!iotDataExists || !sampleDataExists) {
      return { valid: false, reason: "IoT Data or Sample Data missing from IPFS." };
    }

    return { valid: true };
  }
}

module.exports = IPFSHandler;




// // Create a promise that resolves to the IPFS instance
// const ipfsPromise = (async () => {
//     const { create } = await import('kubo-rpc-client');
//     return create({ url: 'http://127.0.0.1:5001' });
//   })();
  
//   class IPFSHandler {
//     /**
//      * Uploads JSON data to IPFS and returns a hash.
//      * - Uses JSON.stringify to ensure data integrity.
//      */
//     static async uploadJSON(data) {
//       try {
//         // Wait until the IPFS instance is ready
//         const ipfs = await ipfsPromise;
//         const { path } = await ipfs.add(JSON.stringify(data));
//         console.log(`📡 Data uploaded to IPFS: ${path}`);
//         return path; // Returns the IPFS hash
//       } catch (error) {
//         console.error("❌ IPFS Upload Error:", error);
//         throw error;
//       }
//     }
  
//     /**
//      * Retrieves JSON data from IPFS using a given hash.
//      */
//     static async getJSON(ipfsHash) {
//       try {
//         // Wait until the IPFS instance is ready
//         const ipfs = await ipfsPromise;
//         const stream = ipfs.cat(ipfsHash);
//         let data = '';
//         for await (const chunk of stream) {
//           data += chunk.toString();
//         }
//         console.log(`📥 Retrieved Data from IPFS: ${ipfsHash}`);
//         return JSON.parse(data); // Converts back to JSON
//       } catch (error) {
//         console.error("❌ IPFS Fetch Error:", error);
//         throw error;
//       }
//     }
//   }
  
//   module.exports = IPFSHandler;
  