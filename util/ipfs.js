const ipfsPromise = (async () => {
  const { create } = await import('kubo-rpc-client');
  return create({ url: 'http://127.0.0.1:5001' });
})();

class IPFSHandler {
  static async uploadJSON(data) {
    try {
      const ipfs = await ipfsPromise;
      const { path } = await ipfs.add(JSON.stringify(data));
      console.log(`📡 JSON Data uploaded to IPFS: ${path}`);
      return path;
    } catch (error) {
      console.error("❌ IPFS JSON Upload Error:", error);
      throw error;
    }
  }

  static async getJSON(ipfsHash) {
    try {
      const ipfs = await ipfsPromise;
      const stream = ipfs.cat(ipfsHash);
      let data = '';
      for await (const chunk of stream) {
        data += chunk.toString();
      }
      console.log(`📥 Raw data retrieved from IPFS (${ipfsHash}): ${data}`);
      data = data.trim();
      // If the data is a comma-separated list of numbers, convert it.
      if (/^(\d+,)+\d+$/.test(data)) {
        const charArray = data.split(',').map(num => String.fromCharCode(Number(num)));
        const jsonString = charArray.join('');
        console.log(`Converted JSON string: ${jsonString}`);
        return JSON.parse(jsonString);
      } else {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("❌ IPFS JSON Fetch Error:", error);
      throw error;
    }
  }

  static async uploadFile(buffer) {
    try {
      const ipfs = await ipfsPromise;
      const { path } = await ipfs.add(buffer);
      console.log(`📡 File uploaded to IPFS: ${path}`);
      return path;
    } catch (error) {
      console.error("❌ IPFS File Upload Error:", error);
      throw error;
    }
  }

  static async getFile(ipfsHash) {
    try {
      const ipfs = await ipfsPromise;
      const stream = ipfs.cat(ipfsHash);
      let buffer = [];
      for await (const chunk of stream) {
        buffer.push(chunk);
      }
      console.log(`📥 Retrieved File from IPFS: ${ipfsHash}`);
      return Buffer.concat(buffer);
    } catch (error) {
      console.error("❌ IPFS File Fetch Error:", error);
      throw error;
    }
  }

  static async verifyFile(ipfsHash) {
    try {
      await IPFSHandler.getFile(ipfsHash);
      console.log(`✅ File verified on IPFS: ${ipfsHash}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ File NOT found on IPFS: ${ipfsHash}`);
      return false;
    }
  }

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


// const ipfsPromise = (async () => {
//   const { create } = await import('kubo-rpc-client');
//   return create({ url: 'http://127.0.0.1:5001' });
// })();

// class IPFSHandler {
//   static async uploadJSON(data) {
//     try {
//       const ipfs = await ipfsPromise;
//       const { path } = await ipfs.add(JSON.stringify(data));
//       console.log(`📡 JSON Data uploaded to IPFS: ${path}`);
//       return path;
//     } catch (error) {
//       console.error("❌ IPFS JSON Upload Error:", error);
//       throw error;
//     }
//   }

//   static async getJSON(ipfsHash) {
//     try {
//       const ipfs = await ipfsPromise;
//       const stream = ipfs.cat(ipfsHash);
//       let data = '';
//       for await (const chunk of stream) {
//         data += chunk.toString();
//       }
//       console.log(`📥 Retrieved JSON Data from IPFS: ${ipfsHash}`);
//       return JSON.parse(data);
//     } catch (error) {
//       console.error("❌ IPFS JSON Fetch Error:", error);
//       throw error;
//     }
//   }

//   static async uploadFile(buffer) {
//     try {
//       const ipfs = await ipfsPromise;
//       const { path } = await ipfs.add(buffer);
//       console.log(`📡 File uploaded to IPFS: ${path}`);
//       return path;
//     } catch (error) {
//       console.error("❌ IPFS File Upload Error:", error);
//       throw error;
//     }
//   }

//   static async getFile(ipfsHash) {
//     try {
//       const ipfs = await ipfsPromise;
//       const stream = ipfs.cat(ipfsHash);
//       let buffer = [];
//       for await (const chunk of stream) {
//         buffer.push(chunk);
//       }
//       console.log(`📥 Retrieved File from IPFS: ${ipfsHash}`);
//       return Buffer.concat(buffer);
//     } catch (error) {
//       console.error("❌ IPFS File Fetch Error:", error);
//       throw error;
//     }
//   }

//   static async verifyFile(ipfsHash) {
//     try {
//       await IPFSHandler.getFile(ipfsHash);
//       console.log(`✅ File verified on IPFS: ${ipfsHash}`);
//       return true;
//     } catch (error) {
//       console.warn(`⚠️ File NOT found on IPFS: ${ipfsHash}`);
//       return false;
//     }
//   }

//   static async validateTransactionData(transaction) {
//     if (!transaction.iotData || !transaction.sampleData) {
//       return { valid: false, reason: "Missing IoT or sample data in transaction." };
//     }
//     const iotDataExists = await IPFSHandler.verifyFile(transaction.iotData);
//     const sampleDataExists = await IPFSHandler.verifyFile(transaction.sampleData);
//     if (!iotDataExists || !sampleDataExists) {
//       return { valid: false, reason: "IoT Data or Sample Data missing from IPFS." };
//     }
//     return { valid: true };
//   }
// }

// module.exports = IPFSHandler;


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
  