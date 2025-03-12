const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-cd49875d-585e-4e62-acb3-5eb7888142d3',
  subscribeKey: 'sub-c-f03c2efa-8490-4ac8-bd64-a1570dd4a599',
  secretKey: 'sec-c-NWIyNDZlZDItYWYyOS00ZWNlLTgzMTEtYjJiNDMyZjJiZTcz'
};


const CHANNELS = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
  VALIDATION: 'VALIDATION',
  IOT_DATA: 'IOT_DATA',
  PAYMENT: 'PAYMENT',
  VALIDATOR_ASSIGNMENT: 'VALIDATOR_ASSIGNMENT',
  USER_REGISTRATION: 'USER_REGISTRATION',
  VALIDATOR_REGISTRATION: 'VALIDATOR_REGISTRATION',
  VALIDATOR_POOL: 'VALIDATOR_POOL'
};

class PubSub {
  constructor({ blockchain, transactionPool, validatorPool, paymentProcessor, qualityCheck, userRegistry }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.validatorPool = validatorPool;
    this.paymentProcessor = paymentProcessor;
    this.qualityCheck = qualityCheck;
    this.userRegistry = userRegistry;
    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.createListener());
  }

  handleMessage(channel, message) {
    const parsedMessage = JSON.parse(message);
    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
        });
        break;
      case CHANNELS.TRANSACTION:
        console.log(`🔄 New Transaction received`);
        this.transactionPool.setTransaction(parsedMessage);
        break;
      case CHANNELS.VALIDATION:
        console.log(`🔍 Validator decision received`);
        this.validatorPool.registerValidator(parsedMessage.validatorId);
        break;
      case CHANNELS.IOT_DATA:
        console.log(`📡 IoT Data received`);
        break;
      case CHANNELS.PAYMENT:
        console.log(`💰 Payment processed`);
        break;
      case CHANNELS.USER_REGISTRATION:
        console.log(`✅ New user registered: ${parsedMessage.address}`);
        break;
      case CHANNELS.VALIDATOR_REGISTRATION:
        if (!this.validatorPool.validators[parsedMessage.validatorId]) {
          console.log(`🔔 New Validator Registered: ${parsedMessage.validatorId}`);
          this.validatorPool.registerValidator(parsedMessage.validatorId);
        }
        break;
      case CHANNELS.VALIDATOR_POOL:
        console.log(`🔄 Syncing Validator Pool`);
        this.validatorPool.syncValidatorPool(parsedMessage);
        break;
      default:
        console.warn(`⚠️ Unknown channel: ${channel}`);
    }
  }

  createListener() {
    return {
      message: (messageObject) => {
        const { channel, message } = messageObject;
        this.handleMessage(channel, message);
      }
    };
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }

  broadcastValidatorAssignment({ transactionId, validators }) {
    this.publish({
      channel: CHANNELS.VALIDATOR_ASSIGNMENT,
      message: JSON.stringify({ transactionId, validators })
    });
    console.log(`✅ Validators Assigned for Transaction ${transactionId}: ${validators}`);
  }

  broadcastValidatorPool() {
    this.publish({
      channel: CHANNELS.VALIDATOR_POOL,
      message: JSON.stringify(this.validatorPool.validators)
    });
    console.log(`✅ Broadcasted Validator Pool.`);
  }
}

module.exports = PubSub;


// const PubNub = require('pubnub');

// const credentials = {
//   // publishKey: 'pub-c-ce2e6a01-0dd0-4b1d-a63d-d97f66f33609',
//   // subscribeKey: 'sub-c-2f195dcd-8434-4696-8852-59ad66e8b06d',
//   // secretKey: 'sec-c-NTg3MWIyZTItOWI5Yi00YTIxLWI3N2MtMmI3ZDg3ZGRkMzVk'

//   // publishKey:'pub-c-aa425403-113e-4474-a2e7-f84c796d3d6c',
//   // subscribeKey:'sub-c-1066771f-5cba-4f84-9170-08be57e8e7a6',
//   // secretKey:'sec-c-NGU2OWJiNjktZWMxNS00MTQxLWIwMjQtZjM2ZjBkY2RjYjU4'

//   // publishKey:'pub-c-8c2c1fd4-5db4-4e02-943b-61755590cd7c',
//   // subscribeKey:'sub-c-e2131d37-f708-4576-8dce-fbf17ef50246',
//   // secretKey:'sec-c-ZjYzZmZhNjktYTJiNS00ZTg5LThiMjUtZTU5YWMwNGNjMGVl'

//   publishKey:'pub-c-cd49875d-585e-4e62-acb3-5eb7888142d3',
//   subscribeKey:'sub-c-f03c2efa-8490-4ac8-bd64-a1570dd4a599',
//   secretKey:'sec-c-NWIyNDZlZDItYWYyOS00ZWNlLTgzMTEtYjJiNDMyZjJiZTcz'
// };

// const CHANNELS = {
//   TEST: 'TEST',
//   BLOCKCHAIN: 'BLOCKCHAIN',
//   TRANSACTION: 'TRANSACTION'
// };

// class PubSub {
//   constructor({ blockchain, transactionPool }) {
//     this.blockchain = blockchain;
//     this.transactionPool = transactionPool;

//     this.pubnub = new PubNub(credentials);
//     this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
//     this.pubnub.addListener(this.listener());
//   }

//   handleMessage(channel, message) {
//     // console.log(`Message received. Channel: ${channel}. Message: ${message}`);

//     const parsedMessage = JSON.parse(message);

//     switch(channel) {
//       case CHANNELS.BLOCKCHAIN:
//         this.blockchain.replaceChain(parsedMessage, true, () => {
//           this.transactionPool.clearBlockchainTransactions({
//              chain: parsedMessage
//           });
//         });
//         break;
//       case CHANNELS.TRANSACTION:
//         this.transactionPool.setTransaction(parsedMessage);
//         break;
//       default:
//         return;
//     }
//   }


//   listener() {
//     return {
//       message: messageObject => {
//         const { channel, message } = messageObject;

//         this.handleMessage(channel, message);
//       }
//     };
//   }

//   publish({ channel, message}) {

//     this.pubnub.publish({ channel, message });
    
//   }

//   broadcastChain() {
//     this.publish({
//       channel: CHANNELS.BLOCKCHAIN,
//       message: JSON.stringify(this.blockchain.chain)
//     });
//   }

//   broadcastTransaction(transaction) {
//     this.publish({
//       channel: CHANNELS.TRANSACTION,
//       message: JSON.stringify(transaction)
//     })
//   }
// }

// module.exports = PubSub;
// const PubNub = require('pubnub');

// const credentials = {
//   publishKey: 'pub-c-cd49875d-585e-4e62-acb3-5eb7888142d3',
//   subscribeKey: 'sub-c-f03c2efa-8490-4ac8-bd64-a1570dd4a599',
//   secretKey: 'sec-c-NWIyNDZlZDItYWYyOS00ZWNlLTgzMTEtYjJiNDMyZjJiZTcz'
// };

// const CHANNELS = {
//   BLOCKCHAIN: 'BLOCKCHAIN',        
//   TRANSACTION: 'TRANSACTION',      
//   VALIDATION: 'VALIDATION',        
//   IOT_DATA: 'IOT_DATA',            
//   PAYMENT: 'PAYMENT',              
//   VALIDATOR_ASSIGNMENT: 'VALIDATOR_ASSIGNMENT'  // ✅ New Channel for Auto Validator Selection
// };

// class PubSub {
//   constructor({ blockchain, transactionPool, validatorPool, paymentProcessor, qualityCheck }) {
//     this.blockchain = blockchain;
//     this.transactionPool = transactionPool;
//     this.validatorPool = validatorPool;
//     this.paymentProcessor = paymentProcessor;
//     this.qualityCheck = qualityCheck;

//     this.pubnub = new PubNub(credentials);
//     this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
//     this.pubnub.addListener(this.listener());
//   }

//   handleMessage(channel, message) {
//     const parsedMessage = JSON.parse(message);

//     switch (channel) {
//       case CHANNELS.BLOCKCHAIN:
//         this.blockchain.replaceChain(parsedMessage, true, () => {
//           this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
//         });
//         break;

//       case CHANNELS.TRANSACTION: // ✅ Farmer submits produce details
//         this.transactionPool.setTransaction(parsedMessage);
//         this.autoAssignValidators(parsedMessage.transactionId);
//         console.log(`New Produce Submission: ${parsedMessage.farmerId}`);
//         break;

//       case CHANNELS.VALIDATOR_ASSIGNMENT: // ✅ Notify Validators
//         console.log(`Validators Assigned: ${parsedMessage.validators}`);
//         break;

//       case CHANNELS.VALIDATION: // ✅ Validators submit approval/rejection
//         this.validatorPool.addValidation(parsedMessage);
//         this.checkValidationConsensus(parsedMessage.transactionId);
//         break;

//       case CHANNELS.IOT_DATA: 
//         this.transactionPool.setTransaction(parsedMessage);
//         console.log(`Received IoT Data for Produce: ${parsedMessage.farmerId}`);
//         break;

//       case CHANNELS.PAYMENT: 
//         this.paymentProcessor.processPayment(parsedMessage);
//         console.log(`Payment Processed for Transaction: ${parsedMessage.transactionId}`);
//         break;

//       default:
//         return;
//     }
//   }

//   /**
//    * ✅ Auto-assign validators when a transaction is created.
//    */
//   autoAssignValidators(transactionId) {
//     const selectedValidators = this.validatorPool.selectValidators(transactionId, 3);

//     this.publish({
//       channel: CHANNELS.VALIDATOR_ASSIGNMENT,
//       message: JSON.stringify({ transactionId, validators: selectedValidators })
//     });

//     console.log(`Validators Assigned for Transaction ${transactionId}: ${selectedValidators}`);
//   }

//   listener() {
//     return {
//       message: messageObject => {
//         const { channel, message } = messageObject;
//         this.handleMessage(channel, message);
//       }
//     };
//   }

//   publish({ channel, message }) {
//     this.pubnub.publish({ channel, message });
//   }

//   broadcastChain() {
//     this.publish({ channel: CHANNELS.BLOCKCHAIN, message: JSON.stringify(this.blockchain.chain) });
//   }

//   broadcastTransaction(transaction) {
//     this.publish({ channel: CHANNELS.TRANSACTION, message: JSON.stringify(transaction) });
//   }

//   broadcastIoTData(iotData) {
//     this.publish({ channel: CHANNELS.IOT_DATA, message: JSON.stringify(iotData) });
//   }

//   broadcastValidation(validation) {
//     this.publish({ channel: CHANNELS.VALIDATION, message: JSON.stringify(validation) });
//   }

//   broadcastValidatorAssignment({ transactionId, validators }) {
//     this.publish({
//         channel: CHANNELS.VALIDATOR_ASSIGNMENT,
//         message: JSON.stringify({ transactionId, validators })
//     });

//     console.log(`✅ Validators Assigned for Transaction ${transactionId}: ${validators}`);
// }


//   broadcastPayment(payment) {
//     this.publish({ channel: CHANNELS.PAYMENT, message: JSON.stringify(payment) });
//   }
// }

// module.exports = PubSub;
