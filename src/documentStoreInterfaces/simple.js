const ethers = require("ethers");
const { getProvider } = require("../utils");
const DocumentStoreABI = require("../../abi/DocumentStore.json");

class SimpleWallet {
  constructor({ network, privateKey, address, waitForConfirmation }) {
    this.network = network;
    this.privateKey = privateKey;
    this.address = address;
    this.waitForConfirmation = waitForConfirmation;
    this.provider = getProvider(network);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(address, DocumentStoreABI, this.wallet);
  }

  async issue(hash) {
    const receipt = await this.contract.issue(hash);
    if (this.waitForConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }

  async revoke(hash) {
    const receipt = await this.contract.revoke(hash);
    if (this.waitForConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }
}

module.exports = SimpleWallet;
