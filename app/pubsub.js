const PubNub = require('pubnub');

const credentials = {
  // publishKey: 'pub-c-ce2e6a01-0dd0-4b1d-a63d-d97f66f33609',
  // subscribeKey: 'sub-c-2f195dcd-8434-4696-8852-59ad66e8b06d',
  // secretKey: 'sec-c-NTg3MWIyZTItOWI5Yi00YTIxLWI3N2MtMmI3ZDg3ZGRkMzVk'
  // publishKey:'pub-c-aa425403-113e-4474-a2e7-f84c796d3d6c',
  // subscribeKey:'sub-c-1066771f-5cba-4f84-9170-08be57e8e7a6',
  // secretKey:'sec-c-NGU2OWJiNjktZWMxNS00MTQxLWIwMjQtZjM2ZjBkY2RjYjU4'

  // publishKey:'pub-c-8c2c1fd4-5db4-4e02-943b-61755590cd7c',
  // subscribeKey:'sub-c-e2131d37-f708-4576-8dce-fbf17ef50246',
  // secretKey:'sec-c-ZjYzZmZhNjktYTJiNS00ZTg5LThiMjUtZTU5YWMwNGNjMGVl'

  publishKey:'pub-c-ac71d476-d910-49ff-9b71-6fa5dcd54c79',
  subscribeKey:'sub-c-c9494396-e18a-4739-a484-b51572e4b26c',
  secretKey:'sec-c-MDY2OTZiYzEtOGVlYS00YjFlLWEzNWQtMzNiMDgyZDRjYzdj'
};

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
  }

  handleMessage(channel, message) {
    // console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch(channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
             chain: parsedMessage
          });
        });
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }


  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        this.handleMessage(channel, message);
      }
    };
  }

  publish({ channel, message}) {

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
    })
  }
}

module.exports = PubSub;
