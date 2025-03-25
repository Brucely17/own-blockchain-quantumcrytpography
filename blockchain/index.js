const Block = require('./block');
const MerkleTree = require('../TrieRoot/merkleeTree');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet/index');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const { cryptoHash } = require('../util');
const QualityCheck = require('../validators/quality-algorithm');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
    this.updateMerkleRoot();
  }

  addBlock({ data }) {
    // Now filter transactions based on finalized qualityDecision.
    const validTransactions = data.filter(tx => {
      return tx.qualityDecision === "APPROVED" || tx.qualityDecision === "AI_APPROVED";
    });

    if (validTransactions.length === 0) {
      console.log('❌ No valid transactions to add. Mining halted.');
      return;
    }

    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data: validTransactions
    });

    if (!newBlock) {
      console.error('❌ Block mining failed due to insufficient quality.');
      return;
    }

    this.chain.push(newBlock);
    this.updateMerkleRoot();
  }

  updateMerkleRoot() {
    const blockHashes = this.chain.map(block => block.hash);
    const merkleTree = new MerkleTree(blockHashes);
    this.merkleRoot = merkleTree.root;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, merkleRoot } = chain[i];
      const actualLastHash = chain[i - 1].hash;

      if (lastHash !== actualLastHash) return false;
      if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;
      if (!Block.validateMerkleRoot(chain[i])) {
        console.error('❌ Invalid Merkle Root for transactions in block');
        return false;
      }

      const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, merkleRoot);
      if (hash !== validatedHash) return false;
    }

    const chainMerkleTree = new MerkleTree(chain.map(block => block.hash));
    if (chainMerkleTree.root !== this.merkleRoot) {
      console.error('❌ Invalid overall Merkle Root for blockchain');
      return false;
    }

    return true;
  }

  replaceChain(newChain, validateTransactions, onSuccess) {
    if (newChain.length <= this.chain.length) {
      console.error('❌ The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(newChain)) {
      console.error('❌ The incoming chain must be valid');
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain: newChain })) {
      console.error('❌ The incoming chain has invalid transaction data');
      return;
    }

    if (onSuccess) onSuccess();
    console.log('🔄 Replacing chain with new valid chain');
    this.chain = newChain;
    this.updateMerkleRoot();
  }

  validTransactionData({ chain }) {
    // (Existing logic for checking each block's transactions.)
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;
          if (rewardTransactionCount > 1) {
            console.error('❌ Miner rewards exceed limit');
            return false;
          }
          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('❌ Invalid mining reward amount');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('❌ Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('❌ Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('❌ Duplicate transaction detected in block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }

  runAIQualityCheck() {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let transaction of block.data) {
        if (!transaction.validatorApprovals || Object.keys(transaction.validatorApprovals).length < 1) {
          const qualityResult = QualityCheck.evaluateQuality(transaction.iotData, transaction.sampleData, transaction.input.address, []);
          console.log(qualityResult, " Blockchain code")
          if (qualityResult.decision === "AUTO_APPROVE") {
            console.log(`🤖 AI auto-approved transaction ${transaction.id}`);
            transaction.qualityDecision = "AUTO_APPROVE";
          } else {
            console.log(`❌ Transaction ${transaction.id} remains rejected.`);
            transaction.qualityDecision = "REJECTED";
          }
        }
      }
    }
  }
}

module.exports = Blockchain;



// const Block = require('./block');
// const MerkleTree = require('../TrieRoot/merkleeTree'); // ✅ Merkle Tree for integrity check
// const Transaction = require('../wallet/transaction');
// const Wallet = require('../wallet');
// const { REWARD_INPUT, MINING_REWARD } = require('../config');
// const { cryptoHash } = require('../util');

// class Blockchain {
//   constructor() {
//     this.chain = [Block.genesis()];
//     this.updateMerkleRoot(); // ✅ Initialize Merkle Root with genesis block
//   }

//   /**
//    * ✅ Add a new block with AI-verified or validator-approved transactions.
//    */
//   addBlock({ data }) {
//     const newBlock = Block.mineBlock({
//       lastBlock: this.chain[this.chain.length - 1],
//       data
//     });

//     this.chain.push(newBlock);
//     this.updateMerkleRoot(); // ✅ Update Merkle Root for the new chain
//   }

//   /**
//    * ✅ Update Merkle Root for the entire blockchain.
//    */
//   updateMerkleRoot() {
//     const blockHashes = this.chain.map(block => block.hash); // ✅ Get each block's hash
//     const merkleTree = new MerkleTree(blockHashes); // ✅ Generate Merkle Tree for blockchain
//     this.merkleRoot = merkleTree.root; // ✅ Store Merkle Root for verification
//   }

//   /**
//    * ✅ Validate the integrity of the entire blockchain.
//    */
//   static isValidChain(chain) {
//     if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

//     for (let i = 1; i < chain.length; i++) {
//       const { timestamp, lastHash, hash, nonce, difficulty, data, merkleRoot } = chain[i];
//       const actualLastHash = chain[i - 1].hash;

//       if (lastHash !== actualLastHash) return false;
//       if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;

//       // ✅ Verify Merkle Root for transaction integrity
//       if (!Block.validateMerkleRoot(chain[i])) {
//         console.error('Invalid Merkle Root for transactions in block');
//         return false;
//       }

//       // ✅ Validate block hash integrity
//       const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, merkleRoot);
//       if (hash !== validatedHash) return false;
//     }

//     // ✅ Verify overall Merkle Root for the blockchain
//     const chainMerkleTree = new MerkleTree(chain.map(block => block.hash));
//     if (chainMerkleTree.root !== chain.merkleRoot) {
//       console.error('Invalid Merkle Root for blockchain');
//       return false;
//     }

//     return true;
//   }

//   /**
//    * ✅ Replace the current chain with a longer valid chain.
//    */
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
//     this.updateMerkleRoot(); // ✅ Update Merkle Root after chain replacement
//   }

//   /**
//    * ✅ Validates transaction data to ensure fairness and security.
//    */
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


// const Block = require('./block');
// const MerkleTree = require('../TrieRoot/merkleeTree'); // Import Merkle Tree class
// const Transaction = require('../wallet/transaction');
// const Wallet = require('../wallet');
// const { REWARD_INPUT, MINING_REWARD } = require('../config');
// const { cryptoHash } = require('../util');

// class Blockchain {
//   constructor() {
//     this.chain = [Block.genesis()];
//     this.updateMerkleRoot(); // Initialize Merkle Root with genesis block
//   }

//   // Add a block and update the Merkle Root of the entire chain
//   addBlock({ data }) {
//     const newBlock = Block.mineBlock({
//       lastBlock: this.chain[this.chain.length - 1],
//       data
//     });
//     this.chain.push(newBlock);
//     this.updateMerkleRoot(); // Recalculate Merkle Root after adding a new block
//   }

//   // Calculate and update the Merkle Root of the chain based on block hashes
//   updateMerkleRoot() {
//     const blockHashes = this.chain.map(block => block.hash); // Get each block's hash
//     const merkleTree = new MerkleTree(blockHashes); // Build Merkle Tree of block hashes
//     this.merkleRoot = merkleTree.root; // Set the chain's Merkle Root
//   }

//   // Validate chain with Merkle Root verification
//   static isValidChain(chain) {
//     if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

//     for (let i = 1; i < chain.length; i++) {
//       const { timestamp, lastHash, hash, nonce, difficulty, data, merkleRoot } = chain[i];
//       const actualLastHash = chain[i - 1].hash;

//       if (lastHash !== actualLastHash) return false;
//       if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;

//       // Verify Merkle Root of transactions in each block
//       if (!Block.validateMerkleRoot(chain[i])) {
//         console.error('Invalid Merkle Root for transactions in block');
//         return false;
//       }

//       // Validate block hash integrity
//       const validatedHash = cryptoHash(timestamp, lastHash, merkleRoot, nonce, difficulty);
//       if (hash !== validatedHash) return false;
//     }

//     // Verify overall Merkle Root for chain
//     const chainMerkleTree = new MerkleTree(chain.map(block => block.hash));
//     if (chainMerkleTree.root !== chain.merkleRoot) {
//       console.error('Invalid Merkle Root for blockchain');
//       return false;
//     }

//     return true;
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
//     this.updateMerkleRoot(); // Update Merkle Root with the new chain
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

