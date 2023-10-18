const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const bcrypt = require('bcryptjs');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
<<<<<<< HEAD
const BankAccount = require('./database/models/BankAccountSchema');
const User = require('./database/models/UserSchema');
const walletAccount=require('./database/models/WalletSchema');
=======
const BankAccount = require('./database/models/AccountSchema');
>>>>>>> origin/main
const db=require('./database/db')
const mongoose = require('mongoose');
db.getDatabase()

const isDevelopment = process.env.ENV === 'development';

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet =new Wallet();

const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

<<<<<<< HEAD

//signup -------- login

// app.post('/signup',async(req,res)=>{
//   const {username,password}=req.body;
//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       username,
     
//       password: hashedPassword
//     });

//     res.status(201).json({ user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

app.post('/login', async (req, res) => {
  const { state,username, password } = req.body;

  if (state=='login'){
  try {
    const foundUser = await User.findOne({ username });

    if (!foundUser) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
  
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  
    res.status(200).json({ username: foundUser,bank: foundUser.bankAccounts,status:true });
    // res.redirect('/')
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}
//signup 

else if (state=='signup'){
  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
     
      password: hashedPassword
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
});






=======
>>>>>>> origin/main
//account

// Create a new bank account
app.post('/api/bankaccounts', async (req, res) => {
  try {
<<<<<<< HEAD

    // const wallet = new Wallet(req.body[balance]);
    
    // req.body[publicKey]=wallet.publicKey;
    // console.log('Bankaccount details:',wallet.balance,wallet.keyPair,wallet.publicKey )
    req.body.balance=Math.ceil(Math.random()*100000)
    const bankAccount = await BankAccount.create(req.body);

    // Set bankAccountId to the string representation of _id
    bankAccount.bankAccountId = bankAccount._id.toString();

    // Save the bankAccount to update the bankAccountId
    await bankAccount.save();
    console.log('request from frontend:',req.body,bankAccount.bankAccountId);
=======
    
    req.body.balance=Math.ceil(Math.random()*10000);
    const bankAccount = await BankAccount.create(req.body);

    console.log('request from frontend:',req.body);
>>>>>>> origin/main
    res.json(bankAccount);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bank accounts
app.get('/api/bankaccounts', async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find();
    res.json(bankAccounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




//



app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.get('/api/blocks/length', (req, res) => {
  res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
  const { id } = req.params;
  const { length } = blockchain.chain;

  const blocksReversed = blockchain.chain.slice().reverse();

  let startIndex = (id-1) * 5;
  let endIndex = id * 5;

  startIndex = startIndex < length ? startIndex : length;
  endIndex = endIndex < length ? endIndex : length;

  res.json(blocksReversed.slice(startIndex, endIndex));
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });

  pubsub.broadcastChain();

  res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool
    .existingTransaction({ inputAddress: wallet.publicKey });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain
      });
    }
  } catch(error) {
    return res.status(400).json({ type: 'error', message: error.message });
  }

  transactionPool.setTransaction(transaction);

  pubsub.broadcastTransaction(transaction);

  res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey;

  res.json({
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
  });
});

app.get('/api/known-addresses', (req, res) => {
  const addressMap = {};

  for (let block of blockchain.chain) {
    for (let transaction of block.data) {
      const recipient = Object.keys(transaction.outputMap);

      recipient.forEach(recipient => addressMap[recipient] = recipient);
    }
  }

  res.json(Object.keys(addressMap));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  });
};

if (isDevelopment) {
  const walletFoo = new Wallet();
  const walletBar = new Wallet();

  const generateWalletTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
      recipient, amount, chain: blockchain.chain
    });

    transactionPool.setTransaction(transaction);
  };

  const walletAction = () => generateWalletTransaction({
    wallet, recipient: walletFoo.publicKey, amount: 5
  });

  const walletFooAction = () => generateWalletTransaction({
    wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
  });

  const walletBarAction = () => generateWalletTransaction({
    wallet: walletBar, recipient: wallet.publicKey, amount: 15
  });

  for (let i=0; i<10; i++) {
    if (i%3 === 0) {
      walletAction();
      walletFooAction();
    } else if (i%3 === 1) {
      walletAction();
      walletBarAction();
    } else {
      walletFooAction();
      walletBarAction();
    }

    transactionMiner.mineTransactions();
  }
}

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});
