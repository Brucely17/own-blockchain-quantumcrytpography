const crypto = require('crypto');
const { cryptoHash } = require('../util'); 

// ✅ Merkle Tree Class for Blockchain Transactions & Quality Verification
class MerkleTree {
  constructor(transactions) {
    this.transactions = transactions.map(tx => cryptoHash(JSON.stringify(tx))); // ✅ Hash each transaction
    this.root = this.buildMerkleTree(this.transactions);
  }

  /**
   * ✅ Builds the Merkle Tree recursively and returns the root hash.
   */
  buildMerkleTree(nodes) {
    if (nodes.length === 1) return nodes[0]; // ✅ Root hash when one node remains

    const updatedNodes = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left; // ✅ If odd number of nodes, duplicate last one
      updatedNodes.push(cryptoHash(left + right)); // ✅ Hash of concatenated left + right nodes
    }

    return this.buildMerkleTree(updatedNodes);
  }

  /**
   * ✅ Builds and returns all levels of the Merkle Tree for visualization.
   */
  buildLevels() {
    let nodes = [...this.transactions];
    const levels = [nodes];

    while (nodes.length > 1) {
      const updatedNodes = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1] || left;
        updatedNodes.push(cryptoHash(left + right));
      }
      levels.push(updatedNodes);
      nodes = updatedNodes;
    }

    return levels;
  }

  /**
   * ✅ Generates a Merkle Proof for a specific transaction.
   * - Ensures that transactions can be independently verified.
   */
  generateMerkleProof(transaction) {
    let nodes = [...this.transactions];
    let proof = [];
    let index = nodes.indexOf(cryptoHash(JSON.stringify(transaction)));

    if (index === -1) return null; // ❌ Transaction not found

    while (nodes.length > 1) {
      const updatedNodes = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1] || left;

        if (i === index || i + 1 === index) {
          proof.push(i === index ? right : left);
        }

        updatedNodes.push(cryptoHash(left + right));
      }

      index = Math.floor(index / 2);
      nodes = updatedNodes;
    }

    return proof;
  }

  /**
   * ✅ Verifies a transaction using a Merkle Proof.
   */
  verifyMerkleProof(transaction, proof, root) {
    let hash = cryptoHash(JSON.stringify(transaction));

    proof.forEach(siblingHash => {
      hash = cryptoHash(hash + siblingHash);
    });

    return hash === root;
  }

  /**
   * ✅ Validates the integrity of transactions using the Merkle Root.
   */
  static validateMerkleRoot(transactions, merkleRoot) {
    const newMerkleTree = new MerkleTree(transactions.map(tx => JSON.stringify(tx)));
    return newMerkleTree.root === merkleRoot;
  }
}

module.exports = MerkleTree;


// const crypto = require('crypto');

// // ✅ Utility function to create a SHA-256 hash
// function cryptoHash(data) {
//   const hashData = typeof data === 'object' ? JSON.stringify(data) : data;
//   return crypto.createHash('sha256').update(hashData).digest('hex');
// }

// // ✅ Merkle Tree Class for Blockchain Transactions
// class MerkleTree {
//   constructor(transactions) {
//     this.transactions = transactions.map(tx => cryptoHash(JSON.stringify(tx))); // ✅ Hash each transaction
//     this.root = this.buildMerkleTree(this.transactions);
//   }

//   /**
//    * ✅ Builds the Merkle Tree recursively and returns the root hash.
//    */
//   buildMerkleTree(nodes) {
//     if (nodes.length === 1) return nodes[0]; // ✅ Root hash when one node remains

//     const updatedNodes = [];
//     for (let i = 0; i < nodes.length; i += 2) {
//       const left = nodes[i];
//       const right = nodes[i + 1] || left; // ✅ If odd number of nodes, duplicate last one
//       updatedNodes.push(cryptoHash(left + right)); // ✅ Hash of concatenated left + right nodes
//     }

//     return this.buildMerkleTree(updatedNodes);
//   }

//   /**
//    * ✅ Builds and returns all levels of the Merkle Tree for visualization.
//    */
//   buildLevels() {
//     let nodes = [...this.transactions];
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

//   /**
//    * ✅ Generates a Merkle Proof for a specific transaction.
//    */
//   generateMerkleProof(transaction) {
//     let nodes = [...this.transactions];
//     let proof = [];
//     let index = nodes.indexOf(cryptoHash(JSON.stringify(transaction)));

//     if (index === -1) return null; // ❌ Transaction not found

//     while (nodes.length > 1) {
//       const updatedNodes = [];
//       for (let i = 0; i < nodes.length; i += 2) {
//         const left = nodes[i];
//         const right = nodes[i + 1] || left;

//         if (i === index || i + 1 === index) {
//           proof.push(i === index ? right : left);
//         }

//         updatedNodes.push(cryptoHash(left + right));
//       }

//       index = Math.floor(index / 2);
//       nodes = updatedNodes;
//     }

//     return proof;
//   }

//   /**
//    * ✅ Verifies a transaction using a Merkle Proof.
//    */
//   verifyMerkleProof(transaction, proof, root) {
//     let hash = cryptoHash(JSON.stringify(transaction));

//     proof.forEach(siblingHash => {
//       hash = cryptoHash(hash + siblingHash);
//     });

//     return hash === root;
//   }
// }

// module.exports = MerkleTree;


// const crypto = require('crypto');

// // Utility to hash data using SHA-256
// function cryptoHash(data) {
//   // Convert non-string data to JSON string for consistent hashing
//   const hashData = typeof data === 'object' ? JSON.stringify(data) : data;
//   return crypto.createHash('sha256').update(hashData).digest('hex');
// }

// // Merkle Tree Class for Blockchain Blocks
// class MerkleTree {
//   constructor(blocks) {
//     // Hash each block’s data to create an initial list of block hashes
//     this.blockHashes = blocks.map(block => cryptoHash(block));
//     this.root = this.buildMerkleTree(this.blockHashes);
//   }

//   // Recursive function to build the Merkle Tree and return the root
//   buildMerkleTree(nodes) {
//     if (nodes.length === 1) return nodes[0]; // If there's only one node, it's the root

//     const updatedNodes = [];
//     for (let i = 0; i < nodes.length; i += 2) {
//       const left = nodes[i];
//       const right = nodes[i + 1] || left; // Duplicate last node if odd number of nodes
//       updatedNodes.push(cryptoHash(left + right)); // Hash of concatenated left + right nodes
//     }
//     return this.buildMerkleTree(updatedNodes);
//   }

//   // Optional: Build and return all levels of the Merkle Tree for visualization
//   buildLevels() {
//     let nodes = this.blockHashes;
//     const levels = [nodes];

//     while (nodes.length > 1) {
//       const updatedNodes = [];
//       for (let i = 0; i < nodes.length; i += 2) {
//         const left = nodes[i];
//         const right = nodes[i + 1] || left;
//         updatedNodes.push(cryptoHash(left + right));
//       }
//       levels.push(updatedNodes); // Add the current level to levels
//       nodes = updatedNodes; // Move to the next level
//     }
//     return levels; // Returns all levels including the root
//   }
// }

// module.exports = MerkleTree;
