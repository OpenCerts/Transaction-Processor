const ethers = require("ethers");
const DocumentStoreBulkABI = require("../../abi/DocumentStoreBulk.json");
const GnosisMultisigWalletABI = require("../../abi/GnosisMultisigWallet.json");
const { getProvider } = require("../utils");
const Queue = require("better-queue");

class MultisigWallet {
  constructor({
    network,
    privateKey,
    walletAddress,
    documentStoreAddress,
    waitForConfirmation,
    maxTransactionsPerBlock
  } = {}) {
    this.network = network;
    this.privateKey = privateKey;
    this.walletAddress = walletAddress;
    this.documentStoreAddress = documentStoreAddress;
    this.maxTransactionsPerBlock = maxTransactionsPerBlock;
    this.provider = getProvider(network);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.waitForConfirmation = waitForConfirmation;

    this.walletContract = new ethers.Contract(
      walletAddress,
      GnosisMultisigWalletABI,
      this.wallet
    );
    this.documentStoreInterface = new ethers.utils.Interface(
      DocumentStoreBulkABI
    );

    this.issueQueue = new Queue(this.processIssueQueue.bind(this), {
      batchSize: maxTransactionsPerBlock,
      batchDelay: 2000
      // batchDelayTimeout: 1000
    });
    this.revokeQueue = new Queue(this.processRevokeQueue.bind(this), {
      batchSize: maxTransactionsPerBlock,
      batchDelay: 2000
      // batchDelayTimeout: 1000
    });
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
        transactionData,
        {
          gasPrice: ethers.utils.bigNumberify("20000000000"),
          gasLimit: ethers.utils.bigNumberify("8000000")
        }
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
    return new Promise((resolve, reject) => {
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
        transactionData,
        {
          gasPrice: ethers.utils.bigNumberify("20000000000"),
          gasLimit: ethers.utils.bigNumberify("8000000")
        }
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
    return new Promise((resolve, reject) => {
      this.revokeQueue.push(hash, (err, txHash) => {
        if (err) return reject(err);
        resolve(txHash);
      });
    });
  }
}

module.exports = MultisigWallet;
