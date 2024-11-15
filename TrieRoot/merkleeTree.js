// const crypto = require('crypto');

// // Utility to hash data using SHA-256 or Keccak (depending on blockchain design)
// function cryptoHash(data) {
//   // Convert non-string data to JSON string
//   const hashData = typeof data === 'object' ? JSON.stringify(data) : data;
//   return crypto.createHash('sha256').update(hashData).digest('hex');
// }

// // Basic Merkle Tree Class for Transactions
// class MerkleTree {
//   constructor(transactions) {
//     this.transactions = transactions.map(tx => cryptoHash(JSON.stringify(tx)));
//     this.root = this.buildMerkleTree(this.transactions);
//   }

//   buildMerkleTree(nodes) {
//     if (nodes.length === 1) return nodes[0];

//     const updatedNodes = [];
//     for (let i = 0; i < nodes.length; i += 2) {
//       const left = nodes[i];
//       const right = nodes[i + 1] || left;
//       updatedNodes.push(cryptoHash(left + right));
//     }
//     return this.buildMerkleTree(updatedNodes);
//   }

//   buildLevels() {
//     let nodes = this.transactions;
//     const levels = [nodes];

//     while (nodes.length > 1) {
//       const updatedNodes = [];
//       for (let i = 0; i < nodes.length; i += 2) {
//         const left = nodes[i];
//         const right = nodes[i + 1] || left;
//         updatedNodes.push(cryptoHash(left + right));
//       }
//       levels.push(updatedNodes);
//       nodes = updatedNodes;
//     }
//     return levels;
//   }
// }

// module.exports = MerkleTree;
const crypto = require('crypto');

// Utility to hash data using SHA-256
function cryptoHash(data) {
  // Convert non-string data to JSON string for consistent hashing
  const hashData = typeof data === 'object' ? JSON.stringify(data) : data;
  return crypto.createHash('sha256').update(hashData).digest('hex');
}

// Merkle Tree Class for Blockchain Blocks
class MerkleTree {
  constructor(blocks) {
    // Hash each block’s data to create an initial list of block hashes
    this.blockHashes = blocks.map(block => cryptoHash(block));
    this.root = this.buildMerkleTree(this.blockHashes);
  }

  // Recursive function to build the Merkle Tree and return the root
  buildMerkleTree(nodes) {
    if (nodes.length === 1) return nodes[0]; // If there's only one node, it's the root

    const updatedNodes = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left; // Duplicate last node if odd number of nodes
      updatedNodes.push(cryptoHash(left + right)); // Hash of concatenated left + right nodes
    }
    return this.buildMerkleTree(updatedNodes);
  }

  // Optional: Build and return all levels of the Merkle Tree for visualization
  buildLevels() {
    let nodes = this.blockHashes;
    const levels = [nodes];

    while (nodes.length > 1) {
      const updatedNodes = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1] || left;
        updatedNodes.push(cryptoHash(left + right));
      }
      levels.push(updatedNodes); // Add the current level to levels
      nodes = updatedNodes; // Move to the next level
    }
    return levels; // Returns all levels including the root
  }
}

module.exports = MerkleTree;
