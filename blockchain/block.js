// const hexToBinary = require('hex-to-binary');
// const { GENESIS_DATA, MINE_RATE } = require('../config');
// const { cryptoHash } = require('../util');

// class Block {
//   constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
//     this.timestamp = timestamp;
//     this.lastHash = lastHash;
//     this.hash = hash;
//     this.data = data;
//     this.nonce = nonce;
//     this.difficulty = difficulty;
//   }

//   static genesis() {
//     return new this(GENESIS_DATA);
//   }

//   static mineBlock({ lastBlock, data }) {
//     const lastHash = lastBlock.hash;
//     let hash, timestamp;
//     let { difficulty } = lastBlock;
//     let nonce = 0;

//     do {
//       nonce++;
//       timestamp = Date.now();
//       difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
//       hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
//     } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

//     return new this({ timestamp, lastHash, data, difficulty, nonce, hash });
//   }

//   static adjustDifficulty({ originalBlock, timestamp }) {
//     const { difficulty } = originalBlock;

//     if (difficulty < 1) return 1;

//     if ((timestamp - originalBlock.timestamp) > MINE_RATE) return difficulty - 1;

//     return difficulty + 1;
//   }
// }

// module.exports = Block;
const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../util');
// const MerkleTree = require('../TrieRoot/merkleeTree'); // Import Merkle Tree class

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty, merkleRoot }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data; // transactions
    this.nonce = nonce;
    this.difficulty = difficulty;
    
  }

  // Genesis block initialization
  static genesis() {
    return new this(GENESIS_DATA);
  }

  // Mines a new block with given transactions
  static mineBlock({ lastBlock, data }) {
    const lastHash = lastBlock.hash;
    let hash, timestamp;
    let { difficulty } = lastBlock;
    let nonce = 0;
    // Sorting transactions by a unique attribute, like timestamp or id
// const sortedTransactions = data.sort((a, b) => a.timestamp - b.timestamp);




//     // Calculate the Merkle Root for transaction data
//     const merkleTree = new MerkleTree(sortedTransactions);
//     const merkleRoot = merkleTree.root;

    do {
      nonce++;
      // timestamp = '';
      difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
      // Include the Merkle Root in the hash calculation
      hash = cryptoHash(timestamp, lastHash,  nonce, difficulty);
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    // Create and return the new block
    return new this({ timestamp, lastHash, data, difficulty, nonce, hash });
  }

  // Adjust difficulty based on MINE_RATE
  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;
    if (difficulty < 1) return 1;
    return (timestamp - originalBlock.timestamp) > MINE_RATE ? difficulty - 1 : difficulty + 1;
  }

  // Validates that a block's Merkle Root matches its transaction data
 
}

module.exports = Block;

