// paymentProcessor.js
const { cryptoHash, verifySignature } = require('../util');
const Transaction = require('../wallet/transaction');

// This function performs token splitting and updates wallet balances.
// It deducts the total amount from the platform wallet and then credits the farmer and validators.
const processPayment = ({ transaction, platformWallet, walletRegistry }) => {
  // Calculate total payment from transaction details
  const totalAmount = Number(transaction.pricePerKg) * Number(transaction.quantity);
  
  // Distribution percentages (you can adjust these as needed)
  const farmerShare = totalAmount * 0.85;
  const validatorShare = totalAmount * 0.10;
  const platformFee = totalAmount * 0.05;

  console.log(`Processing payment for transaction ${transaction.id}`);
  console.log(`Total: ${totalAmount}, Farmer: ${farmerShare}, Validators: ${validatorShare}, Platform Fee: ${platformFee}`);

  // Check if platform has enough funds
  if (platformWallet.balance < totalAmount) {
    throw new Error("Platform wallet has insufficient funds.");
  }
  
  // Deduct the full amount from the platform wallet
  platformWallet.balance -= totalAmount;

  // Credit the farmer (assumed to be the sender of the transaction)
  const farmerWallet = walletRegistry[transaction.input.address];
  if (farmerWallet) {
    farmerWallet.balance += farmerShare;
    console.log(`Farmer wallet (${farmerWallet.publicKey}) new balance: ${farmerWallet.balance}`);
  } else {
    console.error("Farmer wallet not found in registry.");
  }

  // Distribute validator share equally among participating validators
  const validatorIds = Object.keys(transaction.validatorApprovals || {});
  if (validatorIds.length > 0) {
    const perValidatorPayment = validatorShare / validatorIds.length;
    validatorIds.forEach(vid => {
      if (walletRegistry[vid]) {
        walletRegistry[vid].balance += perValidatorPayment;
        console.log(`Validator ${vid} new balance: ${walletRegistry[vid].balance}`);
      } else {
        console.error(`Validator wallet ${vid} not found in registry.`);
      }
    });
  } else {
    console.warn("No validators participated in this transaction.");
  }

  // Platform retains the platform fee (already deducted)

  // Construct a payment message for digital signature
  const paymentData = {
    transactionId: transaction.id,
    totalAmount,
    farmerShare,
    validatorShare,
    platformFee,
    platformBalance: platformWallet.balance
  };
  const message = cryptoHash(JSON.stringify(paymentData));
  const signature = platformWallet.sign(message);

  // Verify the signature (this is optional but demonstrates integrity)
  const isValid = verifySignature({
    publicKey: platformWallet.publicKey,
    data: message,
    signature
  });
  if (!isValid) {
    throw new Error("Digital signature verification failed for payment transaction.");
  }

  console.log("Digital signature verified successfully.");

  return {
    message: "Payment processed successfully.",
    distribution: { farmerShare, validatorShare, platformFee },
    updatedBalances: {
      farmer: farmerWallet ? farmerWallet.balance : null,
      platform: platformWallet.balance
    },
    signature
  };
};

module.exports = { processPayment };
