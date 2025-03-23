const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Transaction = require('./wallet/transaction');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const ValidatorPool = require('./validators/validator-pool');
const QualityCheck = require('./validators/quality-algorithm');
const IPFS = require('./util/ipfs');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
let wallet = new Wallet();
const validatorPool = new ValidatorPool();
const pubsub = new PubSub({ blockchain, transactionPool, validatorPool });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub, validatorPool });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

/**
 * Register as a Farmer, Validator, or Customer.
 */
app.post('/api/register', async (req, res) => {
  const { role } = req.body;
  if (!role || !["farmer", "validator", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role selection" });
  }
  if (role === "validator") {
    try {
      wallet.stakeTokens(); // Reduces balance and marks wallet as validator.
      if (validatorPool.registerValidator(wallet.publicKey)) {
        pubsub.broadcastValidatorPool();
      }
    } catch (err) {
      return res.status(400).json({ error: "Insufficient balance to stake as validator" });
    }
  }
  res.json({ message: `Registered as ${role}`, address: wallet.publicKey, staked: wallet.stake });
});

/**
 * Retrieve Wallet Information.
 */
app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey;
  const balance = Wallet.calculateBalance({ chain: blockchain.chain, address });
  res.json({ address, balance, staked: wallet.stake });
});

/**
 * Farmer Submits Produce Data.
 */
app.post('/api/submit-produce', async (req, res) => {
  try {
    const { farmerId, pricePerKg, quantity, iotData } = req.body;
    if (!farmerId || !pricePerKg || !quantity || !iotData) {
      return res.status(400).json({ error: "Missing required data" });
    }
    const iotDataIPFS = await IPFS.uploadJSON(iotData);
    let transaction = new Transaction({
      senderWallet: wallet,
      recipient: farmerId,
      amount: pricePerKg * quantity,
      pricePerKg,
      quantity,
      iotData: iotDataIPFS,
      qualityScore: 0,
      validatorApprovals: {}
    });
    // Assign the transaction to 3 validators.
    const assignedValidators = validatorPool.assignTransaction(transaction, 3);
    if (!assignedValidators || assignedValidators.length === 0) {
      return res.status(503).json({ error: "All validator queues are full. Please try again later." });
    }
    transaction.assignedValidators = assignedValidators;
    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    pubsub.broadcastValidatorAssignment({ transactionId: transaction.id, validators: assignedValidators });
    res.json({ type: 'success', transaction, assignedValidators });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit produce data" });
  }
});

/**
 * Validator Validates Produce.
 */
app.post('/api/validate-produce', async (req, res) => {
  try {
    const { validatorId, transactionId, sampleData, approval } = req.body;
    if (!validatorId || !transactionId || !sampleData || !approval) {
      return res.status(400).json({ error: "Missing required data" });
    }
    let txData = transactionPool.transactionMap[transactionId];
    if (!txData) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    let transaction = txData instanceof Transaction ? txData : Transaction.fromJSON(txData);
    if (!transaction.assignedValidators || !transaction.assignedValidators.includes(validatorId)) {
      return res.status(403).json({ error: "You are not assigned to validate this transaction." });
    }
    const sampleDataIPFS = await IPFS.uploadJSON(sampleData);
    transaction.sampleData = sampleDataIPFS;
    transaction.updateValidation({ validatorWallet: { publicKey: validatorId }, approval });
    validatorPool.removeTransactionFromQueue(validatorId, transactionId);
    // Finalize only if all assigned validators have voted.
    await transaction.finalizeTransaction();
    pubsub.broadcastTransaction(transaction);
    res.json({ type: 'success', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to validate transaction" });
  }
});

/**
 * Mine Transactions (Manual Trigger for testing).
 */
app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();
  res.redirect('/api/blocks');
});

/**
 * Retrieve Blockchain Data.
 */
app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

/**
 * Retrieve Validator List.
 */
app.get('/api/validators', (req, res) => {
  res.json(validatorPool.validators);
});

/**
 * Retrieve Transaction Pool Map.
 */
app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap);
});

/**
 * Retrieve Known Wallet Addresses.
 */
app.get('/api/known-addresses', async (req, res) => {
  const addressMap = {};
  for (let block of blockchain.chain) {
    for (let transaction of block.data) {
      const recipients = Object.keys(transaction.outputMap);
      recipients.forEach(recipient => addressMap[recipient] = recipient);
    }
  }
  res.json(Object.keys(addressMap));
});

/**
 * Merkle Tree Verification.
 */
app.get('/api/merkle-tree', (req, res) => {
  const blockHashes = blockchain.chain.map(block => block.hash);
  if (blockHashes.length === 0) return res.json({ message: "No blocks available" });
  const MerkleTree = require('./TrieRoot/merkleeTree');
  const merkleTree = new MerkleTree(blockHashes);
  res.json({ merkleRoot: merkleTree.root, levels: merkleTree.buildLevels() });
});

/**
 * Sync Blockchain & Validator Pool with Peers.
 */
const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);
      blockchain.replaceChain(rootChain);
    }
  });
  request({ url: `${ROOT_NODE_ADDRESS}/api/validators` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootValidatorPool = JSON.parse(body);
      validatorPool.syncValidatorPool(rootValidatorPool);
    }
  });
};

let PEER_PORT;
if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}/`);
  syncWithRootState();
});

// Automatic Mining Trigger: Every 5 seconds, check for approved transactions.
setInterval(() => {
  const validTransactions = transactionPool.validTransactions();
  if (validTransactions.length > 0) {
    console.log(`${validTransactions.length} approved transaction(s) detected. Initiating automatic mining...`);
    transactionMiner.mineTransactions();
  }
}, 5000);


// const bodyParser = require('body-parser');
// const express = require('express');
// const request = require('request');
// const path = require('path');
// const bcrypt = require('bcryptjs');
// const Blockchain = require('./blockchain');
// const PubSub = require('./app/pubsub');
// const TransactionPool = require('./wallet/transaction-pool');
// const Wallet = require('./wallet');
// const TransactionMiner = require('./app/transaction-miner');



// const BankAccount = require('./database/models/BankAccountSchema');
// const User = require('./database/models/UserSchema');
// const walletAccount=require('./database/models/WalletSchema');


// const db=require('./database/db')
// const mongoose = require('mongoose');
// const KnownAddress = require('./database/models/KnownAddresses');
// const {VALIDATORS}=require('./config')
// db.getDatabase()

// const isDevelopment = process.env.ENV === 'development';

// const DEFAULT_PORT = 3000;
// const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

// const app = express();
// const blockchain = new Blockchain();
// const transactionPool = new TransactionPool();
// const wallet =new Wallet();

// const pubsub = new PubSub({ blockchain, transactionPool });
// const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'client/dist')));





// //signup -------- login

// // app.post('/signup',async(req,res)=>{
// //   const {username,password}=req.body;
// //   try {
// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     const user = await User.create({
// //       username,
     
// //       password: hashedPassword
// //     });

// //     res.status(201).json({ user });
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// app.post('/login', async (req, res) => {
//   const { state,username, password } = req.body;

//   console.log(state,username,password);


//   if (state=='login'){
//   try {
//     const foundUser = await User.findOne({ username });

//     if (!foundUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }
  
//     const isPasswordValid = await bcrypt.compare(password, foundUser.password);
  
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: 'Invalid password' });
//     }
  
//     res.status(200).json({ username: foundUser,bank: foundUser.bankAccounts,status:true });
//     // res.redirect('/')
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }

// }
// //signup 

// else if (state=='signup'){
//   try {
//     const existingUser = await User.findOne({ username });

//     if (existingUser) {
//       return res.status(409).json({ error: 'Username already exists' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       username,
     
//       password: hashedPassword
//     });

//     res.status(201).json({ user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }
// });










// //account

// // Create a new bank account
// // // app.post('/api/bankaccounts', async (req, res) => {
// //   try {


// //     // const wallet = new Wallet(req.body[balance]);
    
// //     // req.body[publicKey]=wallet.publicKey;
// //     // console.log('Bankaccount details:',wallet.balance,wallet.keyPair,wallet.publicKey )
// //     req.body.balance=Math.ceil(Math.random()*100000)
// //     const bankAccount = await BankAccount.create(req.body);
// //     console.log(bankAccount);
// //     // Set bankAccountId to the string representation of _id
// //     bankAccount.bankAccountId = bankAccount._id.toString();
// //     console.log(bankAccount);

// //     // Save the bankAccount to update the bankAccountId
// //     await bankAccount.save();

// //     const username=bankAccount.name;
// //     const existingUser = await User.findOne({ username });
// //     console.log('checking existing user:',existingUser);
// //     if (existingUser){
// //       existingUser.bankAccounts.push(bankAccount.bankAccountId);
// //       console.log('existingUser:',existingUser);
// //       await existingUser.save()
// //     }
// //     //linking with user
    

// //     //creating wallet
// //     const wallet =new Wallet(bankAccount.balance);
// //     const walletAccount= await WalletAccount.create({
// //         publicKey:wallet.publicKey,
// //         privateKey:wallet.privateKey,
// //         balance:wallet.balance,
// //         bankAccountId:bankAccount.bankAccountId
// //     });
// //     // const knownAddr=await KnownAddress.create({
// //     //   publicKey:wallet.publicKey,
// //     //   name:bankAccount.name

// //     // });
// //     // await knownAddr.save();
// //     // console.log()
// //     console.log('request from frontend:',req.body,bankAccount.bankAccountId,username,existingUser);



// //     // const wallet = new Wallet(req.body[balance]);
    
// //     // req.body[publicKey]=wallet.publicKey;
// //     // console.log('Bankaccount details:',wallet.balance,wallet.keyPair,wallet.publicKey )
// //     req.body.balance=Math.ceil(Math.random()*100000)
// //     const bankAccount = await BankAccount.create(req.body);

// //     // Set bankAccountId to the string representation of _id
// //     bankAccount.bankAccountId = bankAccount._id.toString();

// //     // Save the bankAccount to update the bankAccountId
// //     await bankAccount.save();
// //     console.log('request from frontend:',req.body,bankAccount.bankAccountId);

    
// //     req.body.balance=Math.ceil(Math.random()*10000);
// //     const bankAccount = await BankAccount.create(req.body);

// //     console.log('request from frontend:',req.body);

// //     res.json(bankAccount);

// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // });

// // Get all bank accounts
// app.get('/api/bankaccounts', async (req, res) => {

//   try {
//     const bankAccounts = await BankAccount.find();
//     res.json(bankAccounts);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });




// //



// app.get('/api/blocks', (req, res) => {
//   res.json(blockchain.chain);
// });

// app.get('/api/blocks/length', (req, res) => {
//   res.json(blockchain.chain.length);
// });


// app.post("/?username",async(req,res)=>{
// const username=req.body;
// // const username=req.body;
// const bankAccount=await BankAccount.findOne({username});

// console.log(bankAccount,bankAccount.bankAccountId);
// const bankid=bankAccount.bankAccountId;
// const wallet=await BankAccount.findOne({bankid});
// console.log(wallet);
// res.json(wallet);


// })
// app.get('/api/blocks/:id', (req, res) => {
//   const { id } = req.params;
//   const { length } = blockchain.chain;

//   const blocksReversed = blockchain.chain.slice().reverse();

//   let startIndex = (id-1) * 5;
//   let endIndex = id * 5;

//   startIndex = startIndex < length ? startIndex : length;
//   endIndex = endIndex < length ? endIndex : length;

//   res.json(blocksReversed.slice(startIndex, endIndex));
// });

// app.post('/api/mine', (req, res) => {
//   const { data } = req.body;

//   blockchain.addBlock({ data });

//   pubsub.broadcastChain();

//   res.redirect('/api/blocks');
// });

// app.post('/api/transact', (req, res) => {
//   const { amount, recipient } = req.body;

//   let transaction = transactionPool
//     .existingTransaction({ inputAddress: wallet.publicKey });

//   try {
//     if (transaction) {
//       transaction.update({ senderWallet: wallet, recipient, amount });
//     } else {
//       transaction = wallet.createTransaction({
//         recipient,
//         amount,
//         chain: blockchain.chain
//       });
//     }
//   } catch(error) {
//     return res.status(400).json({ type: 'error', message: error.message });
//   }

//   transactionPool.setTransaction(transaction);

//   pubsub.broadcastTransaction(transaction);

//   res.json({ type: 'success', transaction });
// });

// app.get('/api/transaction-pool-map', (req, res) => {
//   res.json(transactionPool.transactionMap);
// });

// app.get('/api/mine-transactions', (req, res) => {
//   transactionMiner.mineTransactions();
  

//   res.redirect('/api/blocks');
// });

// // app.post('/api/walet-info',async(req,res)=>{
// //   const username=req.body;
// //   const bankAccount=await BankAccount.findOne({username});

// //   console.log(bankAccount,bankAccount.bankAccountId);
// //   const bankid=bankAccount.bankAccountId;
// //   const wallet=await BankAccount.findOne({bankid});
// //   console.log(wallet);
// //   res.json(wallet);
// // })
// app.get('/api/wallet-info', async(req, res) => {
//   const address = wallet.publicKey;

//   res.json({
//     address,
//     balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
//   });
//   // const bankAccountId=req.body.bankAccountId;
//   // console.log(bankAccountId,{bankAccountId});
//   // // const address = wallet.publicKey;
//   // const bank=await BankAccount.findOne({bankAccountId});
//   // const name=bank.name;
//   // console.log(name);
//   // const wallet =await WalletAccount.findOne({bankAccountId});
//   // console.log("wallet is :",wallet);
//   // const address=wallet.publicKey;
//   // const balance=wallet.balance;
//   // res.json({
//   //   name,
//   //   address,
//   //   balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
    
//   // });
// });

// app.get('/api/known-addresses',async (req, res) => {
//   const addressMap = {};

//   for (let block of blockchain.chain) {
//     for (let transaction of block.data) {
//       const recipient = Object.keys(transaction.outputMap);

//       recipient.forEach(recipient => addressMap[recipient] = recipient);
//     }
//   }

//   res.json(Object.keys(addressMap));
//   // const knownAddr=await KnownAddress.find();
//   // console.log(knownAddr);
//   // res.json(knownAddr);

// });


// // merkleetree
// const MerkleTree = require('./TrieRoot/merkleeTree'); // Update the path to your Merkle Tree class

// // Endpoint to get Merkle Tree data for the latest block
// app.get('/api/merkle-tree', (req, res) => {
//   const blockHashes = blockchain.chain.map(block => block.hash); // Get the hash of each block
  
//   if (blockHashes.length === 0) {
//     return res.json({ message: 'No blocks available in the blockchain.' });
//   }

//   // Build Merkle Tree from block hashes
//   const merkleTree = new MerkleTree(blockHashes);
  
//   // Return the Merkle Root and levels of the Merkle Tree
//   res.json({
//     merkleRoot: merkleTree.root,
//     levels: merkleTree.buildLevels() // Returns levels for visualization if needed
//   });
// });

// // post farmer data

// const fs = require('fs');
// const csv = require('csv-parser');
// const stream = require('stream');
// const { promisify } = require('util');

// const pipeline = promisify(stream.pipeline);

// async function downloadAndProcessCSV(url) {
//     try {
//         // Fetch the CSV file
//         const response = await fetch(url);

//         if (!response.ok) {
//             throw new Error(`Failed to fetch CSV: ${response.statusText}`);
//         }

//         // Create a writable stream to save the CSV data
//         const writableStream = fs.createWriteStream('temp.csv');

//         // Pipe the response body to the writable stream
//         await pipeline(response.body, writableStream);

//         console.log('CSV file downloaded successfully.');

//         // Read and process the CSV file
//         const results = [];
//         fs.createReadStream('temp.csv')
//             .pipe(csv())
//             .on('data', (data) => results.push(data))
//             .on('end', () => {
//                 console.log('CSV data processed successfully.');
//                 console.log(results); // Output the parsed CSV data
//                 // You can now work with the `results` array
//             });

//     } catch (error) {
//         console.error('Error downloading or processing the CSV file:', error);
//     }
// }

// app.post('/post', async (req, res) => {
//   const { link } = req.body;

//   if (!link) {
//     return res.status(400).json({ error: 'No link provided' });
//   }

//   try {
//     // Fetch CSV data from the provided link
//     const data = await downloadAndProcessCSV(link);
    
//     // Send back the parsed data
//     res.status(200).json({ data });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist/index.html'));
// });

// const syncWithRootState = () => {
//   request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
//     if (!error && response.statusCode === 200) {
//       const rootChain = JSON.parse(body);

//       // console.log('replace chain on a sync with', rootChain);
//       blockchain.replaceChain(rootChain);
//     }
//   });

//   request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
//     if (!error && response.statusCode === 200) {
//       const rootTransactionPoolMap = JSON.parse(body);

//       // console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
//       transactionPool.setMap(rootTransactionPoolMap);
//     }
//   });
// };

// let PEER_PORT;

// if (process.env.GENERATE_PEER_PORT === 'true') {
//   PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
//   VALIDATORS.push(wallet.publicKey);
//   console.log("VALIDATORS:",VALIDATORS);

// }

// const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
// app.listen(PORT, () => {
//   console.log(`listening at http://localhost:${PORT}/`);

//   if (PORT !== DEFAULT_PORT) {
//     syncWithRootState();
//   }
// });

// const DEFAULT_PORT = 3000;
// const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
// const bodyParser = require('body-parser');
// const express = require('express');
// const request = require('request');
// const path = require('path');
// const bcrypt = require('bcryptjs');
// const Blockchain = require('./blockchain');
// const PubSub = require('./app/pubsub');
// const TransactionPool = require('./wallet/transaction-pool');
// const Transaction = require('./wallet/transaction');  // ✅ FIXED: Transaction Class Imported
// const Wallet = require('./wallet');
// const TransactionMiner = require('./app/transaction-miner');
// const ValidatorPool = require('./validators/validator-pool'); 
// const QualityCheck = require('./validators/quality-algorithm'); 
// const IPFS = require('./util/ipfs'); 
// const MerkleTree = require('./TrieRoot/merkleeTree');  // ✅ FIXED: Merkle Tree Imported

// const db = require('./database/db');
// const mongoose = require('mongoose');
// const { VALIDATORS } = require('./config');

// db.getDatabase();

// const app = express();
// const blockchain = new Blockchain();
// const transactionPool = new TransactionPool();
// const wallet = new Wallet();
// const validatorPool = new ValidatorPool(); 
// const pubsub = new PubSub({ blockchain, transactionPool, validatorPool });
// const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub, validatorPool });

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'client/dist')));

// app.get('/api/wallet-info', (req, res) => {
//   const address = wallet.publicKey;
//   const balance = Wallet.calculateBalance({ chain: blockchain.chain, address });

//   res.json({ address, balance });
// });

// /**
//  * ✅ Farmers Submit Produce Data & IoT Readings
//  */
// app.post('/api/submit-produce', async (req, res) => {
//     try {
//         const { farmerId, pricePerKg, quantity, iotData } = req.body;
//         console.log(farmerId, pricePerKg, quantity, iotData );
        
//         if (!farmerId || !pricePerKg || !quantity || !iotData) {
//             return res.status(400).json({ error: "Missing required data" });
//         }

//         // ✅ Store IoT data in IPFS
//         const iotDataIPFS = await IPFS.uploadJSON(iotData);

//         // ✅ Create a transaction with IoT Data & Validator Selection
//         let transaction = new Transaction({
//             senderWallet: wallet,
//             recipient: farmerId,
//             amount: pricePerKg * quantity,
//             iotData: iotDataIPFS,
//             qualityScore: 0,
//             validatorApprovals: {}
//         });

//         transactionPool.setTransaction(transaction);
//         pubsub.broadcastTransaction(transaction);

//         // ✅ Auto-assign validators
//         const selectedValidators = validatorPool.selectValidators(transaction.id, 3);
//         pubsub.broadcastValidatorAssignment({ transactionId: transaction.id, validators: selectedValidators });

//         res.json({ type: 'success', transaction, assignedValidators: selectedValidators });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to submit produce data" });
//     }
// });

// /**
//  * ✅ Validators Approve/Reject Transactions
//  */
// app.post('/api/validate-produce', async (req, res) => {
//     try {
//         const { validatorId, transactionId, sampleData, approval } = req.body;

//         if (!validatorId || !transactionId || !sampleData || !approval) {
//             return res.status(400).json({ error: "Missing required data" });
//         }

//         let transaction = transactionPool.transactionMap[transactionId];
//         if (!transaction) {
//             return res.status(404).json({ error: "Transaction not found" });
//         }

//         // ✅ Store Sample Data on IPFS
//         const sampleDataIPFS = await IPFS.uploadJSON(sampleData);
//         transaction.sampleData = sampleDataIPFS;
//         transaction.validatorApprovals[validatorId] = approval;

//         // ✅ If 50%+ validators approve, finalize the transaction
//         const approvals = Object.values(transaction.validatorApprovals);
//         if (approvals.filter(a => a === "APPROVED").length >= Math.ceil(Object.keys(validatorPool.validators).length / 2)) {
//             transaction.qualityDecision = "APPROVED";
//             pubsub.broadcastTransaction(transaction);
//         } else if (approvals.length >= Math.ceil(Object.keys(validatorPool.validators).length / 2)) {
//             // ✅ AI Override if rejected
//             const qualityCheck = QualityCheck.evaluateQuality(transaction.iotData, transaction.sampleData);
//             if (qualityCheck.decision === "AUTO_APPROVE") {
//                 transaction.qualityDecision = "AI_APPROVED";
//                 pubsub.broadcastTransaction(transaction);
//             } else {
//                 transaction.qualityDecision = "REJECTED";
//             }
//         }

//         res.json({ type: 'success', transaction });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to validate transaction" });
//     }
// });

// /**
//  * ✅ Mine Transactions (Only Validated Ones)
//  */
// app.get('/api/mine-transactions', (req, res) => {
//     transactionMiner.mineTransactions();
//     res.redirect('/api/blocks');
// });

// /**
//  * ✅ Retrieve Blockchain Data
//  */
// app.get('/api/blocks', (req, res) => {
//     res.json(blockchain.chain);
// });

// /**
//  * ✅ Retrieve Known Wallet Addresses
//  */
// app.get('/api/known-addresses', async (req, res) => {
//     const addressMap = {};
//     for (let block of blockchain.chain) {
//         for (let transaction of block.data) {
//             const recipient = Object.keys(transaction.outputMap);
//             recipient.forEach(recipient => addressMap[recipient] = recipient);
//         }
//     }
//     res.json(Object.keys(addressMap));
// });

// /**
//  * ✅ Retrieve Transaction Pool Map
//  */
// app.get('/api/transaction-pool-map', (req, res) => {
//     res.json(transactionPool.transactionMap);
// });

// /**
//  * ✅ Merkle Tree Verification
//  */
// app.get('/api/merkle-tree', (req, res) => {
//     const blockHashes = blockchain.chain.map(block => block.hash);
//     if (blockHashes.length === 0) return res.json({ message: "No blocks available" });

//     // ✅ FIXED: Use MerkleTree properly
//     const merkleTree = new MerkleTree(blockHashes);
//     res.json({ merkleRoot: merkleTree.root, levels: merkleTree.buildLevels() });
// });

// /**
//  * ✅ Sync Blockchain with Peers
//  */
// const syncWithRootState = () => {
//     request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
//         if (!error && response.statusCode === 200) {
//             const rootChain = JSON.parse(body);
//             blockchain.replaceChain(rootChain);
//         }
//     });

//     request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
//         if (!error && response.statusCode === 200) {
//             const rootTransactionPoolMap = JSON.parse(body);
//             transactionPool.setMap(rootTransactionPoolMap);
//         }
//     });
// };
// let PEER_PORT;

// if (process.env.GENERATE_PEER_PORT === 'true') {
//   PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
//   VALIDATORS.push(wallet.publicKey);
//   console.log("VALIDATORS:",VALIDATORS);

// }


// const PORT = process.env.PORT || PEER_PORT||3000;
// app.listen(PORT, () => {
//     console.log(`Listening at http://localhost:${PORT}/`);
//     syncWithRootState();
// });
