// walletRegistry.js


const walletRegistry = {};

// Add a new wallet to the registry.
const registerWallet = (walletInstance) => {
  walletRegistry[walletInstance.publicKey] = walletInstance;
};

module.exports = { walletRegistry, registerWallet };
