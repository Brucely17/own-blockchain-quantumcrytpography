const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE, AI_NEEDS_REVIEW_THRESHOLD } = require('../config');
const { cryptoHash } = require('../util');
const MerkleTree = require('../TrieRoot/merkleeTree'); 

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty, merkleRoot, qualityScore }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data; // Stores transactions (which should include produce fields like pricePerKg & quantity)
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.merkleRoot = merkleRoot; // Ensures transaction integrity
    this.qualityScore = qualityScore; // AI-calculated produce quality score (average for the block)
  }

  /**
   * Genesis block initialization.
   */
  static genesis() {
    return new this(GENESIS_DATA);
  }

  /**
   * Mines a new block with transactions.
   * Modified to allow mining if every transaction is explicitly approved,
   * even if the computed average quality score is below the threshold.
   */
  static mineBlock({ lastBlock, data }) {
    const lastHash = lastBlock.hash;
    let hash, timestamp;
    let { difficulty } = lastBlock;
    let nonce = 0;

    // Ensure transactions are sorted by timestamp for consistency.
    const sortedTransactions = [...data].sort((a, b) => a.timestamp - b.timestamp);

    // Compute the Merkle Root for transaction integrity.
    const merkleTree = new MerkleTree(sortedTransactions.map(tx => JSON.stringify(tx)));
    const merkleRoot = merkleTree.root;

    // Compute the average Quality Score for the block.
    const totalQualityScore = sortedTransactions.reduce((sum, tx) => sum + (tx.qualityScore || 0), 0);
    const averageQualityScore = sortedTransactions.length ? totalQualityScore / sortedTransactions.length : 0;

    // Check if quality threshold is met OR if every transaction has been explicitly approved.
    const allApproved = sortedTransactions.every(tx => 
      tx.qualityDecision === "APPROVED" || tx.qualityDecision === "AI_APPROVED"
    );
    if (!allApproved && averageQualityScore < AI_NEEDS_REVIEW_THRESHOLD) {
      console.error("⚠️ Block mining halted! Quality Score below threshold and not all transactions are approved.");
      return null; // Prevents block from being mined.
    }

    // Proof-of-Quality (PoQ) Mining Process.
    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
      // Include merkleRoot and averageQualityScore in hash computation.
      hash = cryptoHash(timestamp, lastHash, nonce, difficulty, merkleRoot, averageQualityScore);
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this({ 
      timestamp, 
      lastHash, 
      data: sortedTransactions, 
      difficulty, 
      nonce, 
      hash, 
      merkleRoot, 
      qualityScore: averageQualityScore 
    });
  }

  /**
   * Adjusts difficulty based on MINE_RATE.
   */
  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;
    if (difficulty < 1) return 1;
    return (timestamp - originalBlock.timestamp) > MINE_RATE ? difficulty - 1 : difficulty + 1;
  }

  /**
   * Validates block integrity using Merkle Root.
   */
  static validateMerkleRoot(block) {
    const merkleTree = new MerkleTree(block.data.map(tx => JSON.stringify(tx)));
    return merkleTree.root === block.merkleRoot;
  }

  /**
   * Verifies block legitimacy before adding to blockchain.
   */
  static isValidBlock(block, lastBlock) {
    if (block.lastHash !== lastBlock.hash) {
      console.error("❌ ERROR: Invalid block link detected!");
      return false;
    }
    if (!Block.validateMerkleRoot(block)) {
      console.error("❌ ERROR: Merkle Root Mismatch! Transactions may be altered.");
      return false;
    }
    return true;
  }
}

module.exports = Block;

// const hexToBinary = require('hex-to-binary');
// const { GENESIS_DATA, MINE_RATE } = require('../config');
// const { cryptoHash } = require('../util');
// // const MerkleTree = require('../TrieRoot/merkleeTree'); // Import Merkle Tree class

// class Block {
//   constructor({ timestamp, lastHash, hash, data, nonce, difficulty, merkleRoot }) {
//     this.timestamp = timestamp;
//     this.lastHash = lastHash;
//     this.hash = hash;
//     this.data = data; // transactions
//     this.nonce = nonce;
//     this.difficulty = difficulty;
    
//   }

//   // Genesis block initialization
//   static genesis() {
//     return new this(GENESIS_DATA);
//   }

//   // Mines a new block with given transactions
//   static mineBlock({ lastBlock, data }) {
//     const lastHash = lastBlock.hash;
//     let hash, timestamp;
//     let { difficulty } = lastBlock;
//     let nonce = 0;
//     // Sorting transactions by a unique attribute, like timestamp or id
// // const sortedTransactions = data.sort((a, b) => a.timestamp - b.timestamp);




// //     // Calculate the Merkle Root for transaction data
// //     const merkleTree = new MerkleTree(sortedTransactions);
// //     const merkleRoot = merkleTree.root;

//     do {
//       nonce++;
//       timestamp = Date.now();
//       difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
//       // Include the Merkle Root in the hash calculation
//       hash = cryptoHash(timestamp, lastHash,  nonce, difficulty);
//     } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

//     // Create and return the new block
//     return new this({ timestamp, lastHash, data, difficulty, nonce, hash });
//   }

//   // Adjust difficulty based on MINE_RATE
//   static adjustDifficulty({ originalBlock, timestamp }) {
//     const { difficulty } = originalBlock;
//     if (difficulty < 1) return 1;
//     return (timestamp - originalBlock.timestamp) > MINE_RATE ? difficulty - 1 : difficulty + 1;
//   }

//   // Validates that a block's Merkle Root matches its transaction data
 
// }

// module.exports = Block;




// const hexToBinary = require('hex-to-binary');
// const { GENESIS_DATA, MINE_RATE } = require('../config');
// const { cryptoHash } = require('../util');
// const MerkleTree = require('../TrieRoot/merkleeTree'); // ✅ Import Merkle Tree for transaction integrity

// class Block {
//   constructor({ timestamp, lastHash, hash, data, nonce, difficulty, merkleRoot, qualityScore }) {
//     this.timestamp = timestamp;
//     this.lastHash = lastHash;
//     this.hash = hash;
//     this.data = data; // ✅ Stores transactions
//     this.nonce = nonce;
//     this.difficulty = difficulty;
//     this.merkleRoot = merkleRoot; // ✅ Ensures transaction integrity
//     this.qualityScore = qualityScore; // ✅ Stores AI-calculated produce quality score
//   }

//   // ✅ Genesis block initialization
//   static genesis() {
//     return new this(GENESIS_DATA);
//   }

//   // ✅ Mines a new block with transactions
//   static mineBlock({ lastBlock, data }) {
//     const lastHash = lastBlock.hash;
//     let hash, timestamp;
//     let { difficulty } = lastBlock;
//     let nonce = 0;

//     // ✅ Sort transactions by timestamp for consistency
//     const sortedTransactions = data.sort((a, b) => a.timestamp - b.timestamp);

//     // ✅ Calculate the Merkle Root for transaction data
//     const merkleTree = new MerkleTree(sortedTransactions.map(tx => JSON.stringify(tx)));
//     const merkleRoot = merkleTree.root;

//     // ✅ Aggregate Quality Score for block
//     const totalQualityScore = sortedTransactions.reduce((sum, tx) => sum + tx.qualityScore, 0);
//     const averageQualityScore = sortedTransactions.length ? totalQualityScore / sortedTransactions.length : 0;

//     do {
//       nonce++;
//       timestamp = Date.now();
//       difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });

//       // ✅ Include the Merkle Root and Quality Score in hash calculation
//       hash = cryptoHash(timestamp, lastHash, nonce, difficulty, merkleRoot, averageQualityScore);
//     } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

//     // ✅ Create and return the new block
//     return new this({ timestamp, lastHash, data, difficulty, nonce, hash, merkleRoot, qualityScore: averageQualityScore });
//   }

//   // ✅ Adjust difficulty based on MINE_RATE
//   static adjustDifficulty({ originalBlock, timestamp }) {
//     const { difficulty } = originalBlock;
//     if (difficulty < 1) return 1;
//     return (timestamp - originalBlock.timestamp) > MINE_RATE ? difficulty - 1 : difficulty + 1;
//   }

//   // ✅ Validates block integrity using Merkle Root
//   static validateMerkleRoot(block) {
//     const merkleTree = new MerkleTree(block.data.map(tx => JSON.stringify(tx)));
//     return merkleTree.root === block.merkleRoot;
//   }
// }

// module.exports = Block;
