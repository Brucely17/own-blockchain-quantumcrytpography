

// const _ = require('lodash');
// const { keccakHash } = require('../util');

// class Node {
//   constructor() {
//     this.value = null;
//     this.childMap = {};
//   }
// }

// class Trie {
//   constructor() {
//     this.head = new Node();
//     this.generateRootHash();
//   }

//   generateRootHash() {
//     this.rootHash = keccakHash(this.head);
//   }

//   get({ key }) {
//     let node = this.head;

//     for (let character of key) {
//       if (node.childMap[character]) {
//         node = node.childMap[character];
//       }
//     }

//     return _.cloneDeep(node.value);
//   }

//   put({ key, value }) {
//     let node = this.head;

//     for (let character of key) {
//       if (!node.childMap[character]) {
//         node.childMap[character] = new Node();
//       }

//       node = node.childMap[character];
//     }

//     node.value = value;

//     this.generateRootHash();
//   }

//   static buildTrie({ items }) {
//     const trie = new this();

//     for (let item of items.sort((a, b) => keccakHash(a) > keccakHash(b))) {
//       trie.put({ key: keccakHash(item), value: item });
//     }

//     return trie;
//   }
// }

// module.exports = Trie;
const _ = require('lodash');
const { keccakHash } = require('../util');

class Node {
  constructor() {
    this.value = null;
    this.childMap = {}; // ✅ Stores child nodes for Patricia Trie
  }
}

class Trie {
  constructor() {
    this.head = new Node();
    this.generateRootHash();
  }

  /**
   * ✅ Generates the root hash of the Trie for blockchain validation.
   */
  generateRootHash() {
    this.rootHash = keccakHash(this.head);
  }

  /**
   * ✅ Retrieves a stored value from the Trie.
   */
  get({ key }) {
    let node = this.head;

    for (let character of key) {
      if (node.childMap[character]) {
        node = node.childMap[character];
      } else {
        return null; // ❌ Key not found
      }
    }

    return _.cloneDeep(node.value);
  }

  /**
   * ✅ Stores a new value in the Trie.
   */
  put({ key, value }) {
    let node = this.head;

    for (let character of key) {
      if (!node.childMap[character]) {
        node.childMap[character] = new Node();
      }

      node = node.childMap[character];
    }

    node.value = value;
    this.generateRootHash();
  }

  /**
   * ✅ Deletes a value from the Trie.
   */
  delete({ key }) {
    let node = this.head;
    let stack = [];

    for (let character of key) {
      if (!node.childMap[character]) return false; // ❌ Key not found
      stack.push({ node, character });
      node = node.childMap[character];
    }

    node.value = null;

    // ✅ Cleanup empty nodes
    while (stack.length) {
      const { node, character } = stack.pop();
      if (!node.childMap[character].value && Object.keys(node.childMap[character].childMap).length === 0) {
        delete node.childMap[character];
      }
    }

    this.generateRootHash();
    return true;
  }

  /**
   * ✅ Builds a Trie from a list of items.
   */
  static buildTrie({ items }) {
    const trie = new this();

    for (let item of items.sort((a, b) => keccakHash(a) > keccakHash(b))) {
      trie.put({ key: keccakHash(item), value: item });
    }

    return trie;
  }
}

module.exports = Trie;
