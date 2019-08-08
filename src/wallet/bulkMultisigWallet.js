const ethers = require("ethers");
const Queue = require("better-queue");
const DocumentStoreABI = require("../../abi/DocumentStoreBulk.json");
const GnosisMultisigWalletABI = require("../../abi/GnosisMultisigWallet.json");

class MultisigWallet {
  constructor({
    network = "ropsten",
    privateKey,
    walletAddress,
    documentStoreAddress
  } = {}) {
    this.network = network;
    this.privateKey = privateKey;
    this.walletAddress = walletAddress;
    this.documentStoreAddress = documentStoreAddress;
    this.provider = ethers.getDefaultProvider(network);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.walletContract = new ethers.Contract(
      walletAddress,
      GnosisMultisigWalletABI,
      this.wallet
    );
    this.documentStoreInterface = new ethers.utils.Interface(DocumentStoreABI);
    this.issueQueue = new Queue(this.processIssueQueue.bind(this), {
      batchSize: 2,
      batchDelay: 2000,
      batchDelayTimeout: 1000,
      maxTimeout: 60000
    });
    this.revokeQueue = new Queue(this.processRevokeQueue.bind(this), {
      batchSize: 2,
      batchDelay: 2000,
      batchDelayTimeout: 1000,
      maxTimeout: 60000
    });
    this.waitForConfirmation = false;
  }

  async processIssueQueue(hashesToProcess, callback) {
    try {
      const transactionData = this.documentStoreInterface.functions.bulkIssue.encode(
        [hashesToProcess]
      );
      const valueToTranfer = 0;
      const receipt = await this.walletContract.submitTransaction(
        this.documentStoreAddress,
        valueToTranfer,
        transactionData
      );
      if (this.waitForConfirmation) {
        await receipt.wait();
      }
      callback(null, receipt.hash);
    } catch (error) {
      callback(error);
    }
  }

  async issue(hash) {
    return new Promise(resolve => {
      this.issueQueue.push(hash, (err, txHash) => {
        if (err) return reject(err);
        resolve(txHash);
      });
    });
  }

  async processRevokeQueue(hashesToProcess, callback) {
    try {
      const transactionData = this.documentStoreInterface.functions.bulkRevoke.encode(
        [hashesToProcess]
      );
      const valueToTranfer = 0;
      const receipt = await this.walletContract.submitTransaction(
        this.documentStoreAddress,
        valueToTranfer,
        transactionData
      );
      if (this.waitForConfirmation) {
        await receipt.wait();
      }
      callback(null, receipt.hash);
    } catch (error) {
      callback(error);
    }
  }

  async revoke(hash) {
    return new Promise(resolve => {
      this.revokeQueue.push(hash, (err, txHash) => {
        if (err) return reject(err);
        resolve(txHash);
      });
    });
  }
}

module.exports = MultisigWallet;
