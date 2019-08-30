const ethers = require("ethers");
const DocumentStoreBulkABI = require("../../abi/DocumentStoreBulk.json");
const { getProvider } = require("../utils");
const Queue = require("better-queue");

class BulkWallet {
  constructor({
    network,
    privateKey,
    walletAddress,
    address,
    waitForConfirmation,
    maxTransactionsPerBlock
  } = {}) {
    this.network = network;
    this.privateKey = privateKey;
    this.walletAddress = walletAddress;
    this.provider = getProvider(network);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.documentStoreContract = new ethers.Contract(
      address,
      DocumentStoreBulkABI,
      this.wallet
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
    this.waitForConfirmation = waitForConfirmation;
  }

  async processIssueQueue(hashesToProcess, callback) {
    try {
      const receipt = await this.documentStoreContract.bulkIssue(
        hashesToProcess,
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
        console.log("Returned tx confirmed");
        resolve(txHash);
      });
    });
  }

  async processRevokeQueue(hashesToProcess, callback) {
    try {
      const receipt = await this.documentStoreContract.bulkRevoke(
        hashesToProcess,
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

module.exports = BulkWallet;
