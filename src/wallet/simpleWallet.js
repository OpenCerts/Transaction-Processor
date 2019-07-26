const ethers = require("ethers");
const DocumentStoreABI = require("../../abi/DocumentStore.json");

class SimpleWallet {
  constructor({ network = "ropsten", privateKey, address }) {
    this.network = network;
    this.privateKey = privateKey;
    this.address = address;
    this.provider = ethers.getDefaultProvider(network);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(address, DocumentStoreABI, this.wallet);
  }

  async issue(hash, requireConfirmation = false) {
    const receipt = await this.contract.issue(hash);
    if (requireConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }

  async revoke(hash, requireConfirmation = false) {
    const receipt = await this.contract.revoke(hash);
    if (requireConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }
}

module.exports = SimpleWallet;
