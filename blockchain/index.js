// const Block = require('./block');
// const Transaction = require('../wallet/transaction');
// const Wallet = require('../wallet');
// const { cryptoHash } = require('../util');
// const { REWARD_INPUT, MINING_REWARD } = require('../config');

// class Blockchain {
//   constructor() {
//     this.chain = [Block.genesis()];
//   }

//   addBlock({ data }) {
//     const newBlock = Block.mineBlock({
//       lastBlock: this.chain[this.chain.length-1],
//       data
//     });

//     this.chain.push(newBlock);
//   }

//   replaceChain(chain, validateTransactions, onSuccess) {
//     if (chain.length <= this.chain.length) {
//       console.error('The incoming chain must be longer');
//       return;
//     }

//     if (!Blockchain.isValidChain(chain)) {
//       console.error('The incoming chain must be valid');
//       return;
//     }

//     if (validateTransactions && !this.validTransactionData({ chain })) {
//       console.error('The incoming chain has invalid data');
//       return;
//     }

//     if (onSuccess) onSuccess();
//     console.log('replacing chain with', chain);
//     this.chain = chain;
//   }

//   validTransactionData({ chain }) {
//     for (let i=1; i<chain.length; i++) {
//       const block = chain[i];
//       const transactionSet = new Set();
//       let rewardTransactionCount = 0;

//       for (let transaction of block.data) {
//         if (transaction.input.address === REWARD_INPUT.address) {
//           rewardTransactionCount += 1;

//           if (rewardTransactionCount > 1) {
//             console.error('Miner rewards exceeds limit');
//             return false;
//           }

//           if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
//             console.error('Miner reward amount is invalid');
//             return false;
//           }
//         } else {
//           if (!Transaction.validTransaction(transaction)) {
//             console.error('Invalid transaction');
//             return false;
//           }

//           const trueBalance = Wallet.calculateBalance({
//             chain: this.chain,
//             address: transaction.input.address
//           });

//           if (transaction.input.amount !== trueBalance) {
//             console.error('Invalid input amount');
//             return false;
//           }

//           if (transactionSet.has(transaction)) {
//             console.error('An identical transaction appears more than once in the block');
//             return false;
//           } else {
//             transactionSet.add(transaction);
//           }
//         }
//       }
//     }

//     return true;
//   }

//   static isValidChain(chain) {
//     if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

//     for (let i=1; i<chain.length; i++) {
//       const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
//       const actualLastHash = chain[i-1].hash;
//       const lastDifficulty = chain[i-1].difficulty;

//       if (lastHash !== actualLastHash) return false;

//       const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

//       if (hash !== validatedHash) return false;

//       if (Math.abs(lastDifficulty - difficulty) > 1) return false;
//     }

//     return true;
//   }
// }

// module.exports = Blockchain;
const Block = require('./block');
const MerkleTree = require('../TrieRoot/merkleeTree'); // Import Merkle Tree class
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const { cryptoHash } = require('../util');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
    this.updateMerkleRoot(); // Initialize Merkle Root with genesis block
  }

  // Add a block and update the Merkle Root of the entire chain
  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data
    });
    this.chain.push(newBlock);
    this.updateMerkleRoot(); // Recalculate Merkle Root after adding a new block
  }

  // Calculate and update the Merkle Root of the chain based on block hashes
  updateMerkleRoot() {
    const blockHashes = this.chain.map(block => block.hash); // Get each block's hash
    const merkleTree = new MerkleTree(blockHashes); // Build Merkle Tree of block hashes
    this.merkleRoot = merkleTree.root; // Set the chain's Merkle Root
  }

  // Validate chain with Merkle Root verification
  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, data, merkleRoot } = chain[i];
      const actualLastHash = chain[i - 1].hash;

      if (lastHash !== actualLastHash) return false;
      if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;

      // Verify Merkle Root of transactions in each block
      if (!Block.validateMerkleRoot(chain[i])) {
        console.error('Invalid Merkle Root for transactions in block');
        return false;
      }

      // Validate block hash integrity
      const validatedHash = cryptoHash(timestamp, lastHash, merkleRoot, nonce, difficulty);
      if (hash !== validatedHash) return false;
    }

    // Verify overall Merkle Root for chain
    const chainMerkleTree = new MerkleTree(chain.map(block => block.hash));
    if (chainMerkleTree.root !== chain.merkleRoot) {
      console.error('Invalid Merkle Root for blockchain');
      return false;
    }

    return true;
  }

  replaceChain(newChain, validateTransactions, onSuccess) {
    if (newChain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(newChain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain: newChain })) {
      console.error('The incoming chain has invalid data');
      return;
    }

    if (onSuccess) onSuccess();
    console.log('Replacing chain with', newChain);
    this.chain = newChain;
    this.updateMerkleRoot(); // Update Merkle Root with the new chain
  }

  validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Invalid mining reward amount');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('Duplicate transaction detected in block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }
}

module.exports = Blockchain;



// const Block = require('./block');
// const MerkleTree = require('../TrieRoot/merkleeTree');
// const Transaction = require('../wallet/transaction');
// const Wallet = require('../wallet');
// const { REWARD_INPUT, MINING_REWARD } = require('../config');
// const { cryptoHash } = require('../util');

// class Blockchain {
//   constructor() {
//     this.chain = [Block.genesis()];
//   }

//   addBlock({ data }) {
//     const newBlock = Block.mineBlock({
//       lastBlock: this.chain[this.chain.length - 1],
//       data
//     });
//     this.chain.push(newBlock);
//   }

//   replaceChain(newChain, validateTransactions, onSuccess) {
//     if (newChain.length <= this.chain.length) {
//       console.error('The incoming chain must be longer');
//       return;
//     }

//     if (!Blockchain.isValidChain(newChain)) {
//       console.error('The incoming chain must be valid');
//       return;
//     }

//     if (validateTransactions && !this.validTransactionData({ chain: newChain })) {
//       console.error('The incoming chain has invalid data');
//       return;
//     }

//     if (onSuccess) onSuccess();
//     console.log('Replacing chain with', newChain);
//     this.chain = newChain;
//   }

//   static isValidChain(chain) {
//     if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

//     for (let i = 1; i < chain.length; i++) {
//       const { timestamp, lastHash, hash, nonce, difficulty, data, merkleRoot } = chain[i];
//       const actualLastHash = chain[i - 1].hash;

//       if (lastHash !== actualLastHash) return false;
//       if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;

//       // Verify Merkle Root
//       const merkleTree = new MerkleTree(data);
//       if (merkleRoot !== merkleTree.root) {
//         console.error('Invalid Merkle Root');
//         return false;
//       }

//       // Validate block hash integrity
//       const validatedHash = cryptoHash(timestamp, lastHash, merkleRoot, nonce, difficulty);
//       if (hash !== validatedHash) return false;
//     }
//     return true;
//   }

//   validTransactionData({ chain }) {
//     for (let i = 1; i < chain.length; i++) {
//       const block = chain[i];
//       const transactionSet = new Set();
//       let rewardTransactionCount = 0;

//       for (let transaction of block.data) {
//         if (transaction.input.address === REWARD_INPUT.address) {
//           rewardTransactionCount += 1;

//           if (rewardTransactionCount > 1) {
//             console.error('Miner rewards exceed limit');
//             return false;
//           }

//           if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
//             console.error('Invalid mining reward amount');
//             return false;
//           }
//         } else {
//           if (!Transaction.validTransaction(transaction)) {
//             console.error('Invalid transaction');
//             return false;
//           }

//           const trueBalance = Wallet.calculateBalance({
//             chain: this.chain,
//             address: transaction.input.address
//           });

//           if (transaction.input.amount !== trueBalance) {
//             console.error('Invalid input amount');
//             return false;
//           }

//           if (transactionSet.has(transaction)) {
//             console.error('Duplicate transaction detected in block');
//             return false;
//           } else {
//             transactionSet.add(transaction);
//           }
//         }
//       }
//     }

//     return true;
//   }
// }

// module.exports = Blockchain;
