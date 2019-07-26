const ethers = require("ethers");
const DocumentStoreABI = require("../../abi/DocumentStore.json");
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
  }

  async issue(hash, requireConfirmation = false) {
    const transactionData = this.documentStoreInterface.functions.issue.encode([
      hash
    ]);
    const valueToTranfer = 0;
    const receipt = await this.walletContract.submitTransaction(
      this.documentStoreAddress,
      valueToTranfer,
      transactionData
    );
    if (requireConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }

  async revoke(hash, requireConfirmation = false) {
    const transactionData = this.documentStoreInterface.functions.revoke.encode(
      [hash]
    );
    const valueToTranfer = 0;
    const receipt = await this.walletContract.submitTransaction(
      this.documentStoreAddress,
      valueToTranfer,
      transactionData
    );
    if (requireConfirmation) {
      await receipt.wait();
    }
    return receipt.hash;
  }
}

module.exports = MultisigWallet;
