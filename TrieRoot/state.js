const Trie = require('./Trie');

class State {
  constructor() {
    this.stateTrie = new Trie(); // ✅ Main blockchain state
    this.storageTrieMap = {}; // ✅ Stores additional account-related data
    this.validatorTrie = new Trie(); // ✅ Tracks validator reputation & approvals
    this.produceTrie = new Trie(); // ✅ Stores produce quality & transaction records
  }

  /**
   * ✅ Stores or updates a blockchain account in the state Trie.
   * - Farmers, Validators, and Users are stored with their `publicKey`.
   */
  putAccount({ publicKey, accountData }) {
    if (!this.storageTrieMap[publicKey]) {
      this.storageTrieMap[publicKey] = new Trie();
    }

    this.stateTrie.put({
      key: publicKey,
      value: {
        ...accountData,
        storageRoot: this.storageTrieMap[publicKey].rootHash
      }
    });
  }

  /**
   * ✅ Retrieves account data for Farmers, Validators, or Users.
   */
  getAccount({ publicKey }) {
    return this.stateTrie.get({ key: publicKey });
  }

  /**
   * ✅ Stores validator reputation & approval history dynamically.
   */
  putValidator({ publicKey, reputation, approvals }) {
    let existingValidator = this.getValidator({ publicKey }) || { reputation: 0, approvals: 0 };

    this.validatorTrie.put({
      key: publicKey,
      value: {
        reputation: existingValidator.reputation + reputation,
        approvals: existingValidator.approvals + approvals
      }
    });
  }

  /**
   * ✅ Retrieves validator reputation & approval records.
   */
  getValidator({ publicKey }) {
    return this.validatorTrie.get({ key: publicKey });
  }

  /**
   * ✅ Stores produce data with IoT & validator validation history.
   * - Includes AI-generated quality scores.
   */
  putProduce({ produceId, farmerId, qualityScore, iotData, validationRecords, aiOverride }) {
    this.produceTrie.put({
      key: produceId,
      value: {
        farmerId,
        qualityScore,
        iotData,
        validationRecords,
        aiOverride // ✅ Tracks AI-based auto-approvals
      }
    });
  }

  /**
   * ✅ Retrieves produce transaction details.
   */
  getProduce({ produceId }) {
    return this.produceTrie.get({ key: produceId });
  }

  /**
   * ✅ Gets the root of the state Trie (Used for blockchain validation).
   */
  getStateRoot() {
    return this.stateTrie.rootHash;
  }

  /**
   * ✅ Updates validator reputation based on transaction approvals.
   * - More approvals = Higher Reputation
   */
  updateValidatorReputation({ validatorId, success }) {
    let validator = this.getValidator({ publicKey: validatorId }) || { reputation: 0, approvals: 0 };

    this.putValidator({
      publicKey: validatorId,
      reputation: success ? validator.reputation + 1 : validator.reputation - 1,
      approvals: validator.approvals + 1
    });
  }

  /**
   * ✅ Checks whether a produce transaction is AI-verified.
   */
  isProduceAutoVerified({ produceId }) {
    const produce = this.getProduce({ produceId });
    return produce ? produce.aiOverride : false;
  }
}

module.exports = State;





// const Trie = require('./trie');

// class State {
//   constructor() {
//     this.stateTrie = new Trie();
//     this.storageTrieMap = {};
//   }

//   putAccount({ address, accountData }) {
//     if (!this.storageTrieMap[address]) {
//       this.storageTrieMap[address] = new Trie();
//     }

//     this.stateTrie.put({
//       key: address,
//       value: {
//         ...accountData,
//         storageRoot: this.storageTrieMap[address].rootHash
//       }
//     });
//   }

//   getAccount({ address }) {
//     return this.stateTrie.get({ key: address });
//   }

//   getStateRoot() {
//     return this.stateTrie.rootHash;
//   }
// }

// module.exports = State;
// const Trie = require('./trie');

// class State {
//   constructor() {
//     this.stateTrie = new Trie(); // ✅ Main blockchain state
//     this.storageTrieMap = {}; // ✅ Stores additional account-related data
//     this.validatorTrie = new Trie(); // ✅ Tracks validator reputation & approvals
//     this.produceTrie = new Trie(); // ✅ Stores produce quality & transaction records
//   }

//   /**
//    * ✅ Stores or updates an account in the state Trie.
//    */
//   putAccount({ address, accountData }) {
//     if (!this.storageTrieMap[address]) {
//       this.storageTrieMap[address] = new Trie();
//     }

//     this.stateTrie.put({
//       key: address,
//       value: {
//         ...accountData,
//         storageRoot: this.storageTrieMap[address].rootHash
//       }
//     });
//   }

//   /**
//    * ✅ Retrieves account data.
//    */
//   getAccount({ address }) {
//     return this.stateTrie.get({ key: address });
//   }

//   /**
//    * ✅ Stores validator reputation & approval history.
//    */
//   putValidator({ validatorId, reputation, approvals }) {
//     this.validatorTrie.put({
//       key: validatorId,
//       value: { reputation, approvals }
//     });
//   }

//   /**
//    * ✅ Retrieves validator reputation.
//    */
//   getValidator({ validatorId }) {
//     return this.validatorTrie.get({ key: validatorId });
//   }

//   /**
//    * ✅ Stores produce data with IoT & validation history.
//    */
//   putProduce({ produceId, farmerId, qualityScore, iotData, validationRecords }) {
//     this.produceTrie.put({
//       key: produceId,
//       value: {
//         farmerId,
//         qualityScore,
//         iotData,
//         validationRecords
//       }
//     });
//   }

//   /**
//    * ✅ Retrieves produce transaction details.
//    */
//   getProduce({ produceId }) {
//     return this.produceTrie.get({ key: produceId });
//   }

//   /**
//    * ✅ Gets the root of the state Trie (Used for blockchain validation).
//    */
//   getStateRoot() {
//     return this.stateTrie.rootHash;
//   }
// }

// module.exports = State;
