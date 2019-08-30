const debug = require("debug");
const fs = require("fs");
const { createChannel, createConnection, decodeMessage } = require("../utils");
const { MODE, RABBIT_CONNECTION_STRING } = require("../constants");

// Using first version of the document store that is deployed on admin.opencerts.io
const DSSimple = require("../documentStoreInterfaces/simple");
// Using experimental version of document store that allows bulk issue/revoke using loop
const DSBulk = require("../documentStoreInterfaces/bulk");
// Using Gnosis multisig wallet to manage the first version of the document store
const DSMultisig = require("../documentStoreInterfaces/simpleMultisig");
// TBD: Using Gnosis multisig wallet to manage the experimental version of document store

const log = debug("consumer");

const run = async ({
  mode,
  privateKey,
  network,
  address,
  contractType,
  multisigWallet,
  waitForConfirmation = true,
  logToFile = true
}) => {
  let maxTransactionsPerBlock = 1;
  let transactionProcessor;
  switch (contractType) {
    case "BULK":
      maxTransactionsPerBlock = 128;
      transactionProcessor = new DSBulk({
        waitForConfirmation,
        maxTransactionsPerBlock,
        privateKey,
        network,
        address
      });
      break;
    case "MULTISIG":
      transactionProcessor = new DSMultisig({
        network,
        privateKey,
        waitForConfirmation,
        walletAddress: multisigWallet,
        documentStoreAddress: address
      });
      break;
    case "SIMPLE":
      transactionProcessor = new DSSimple({
        waitForConfirmation,
        privateKey,
        network,
        address
      });
      break;
    default:
      throw new Error("Contract type is not specified");
  }
  const connection = await createConnection(RABBIT_CONNECTION_STRING);
  const channel = await createChannel(connection);
  const contractMethod = mode === MODE.ISSUE ? "issue" : "revoke";
  const walletAddress = transactionProcessor.wallet.signingKey.address;

  // Allow this worker to process maximum of one transaction at a time
  channel.prefetch(maxTransactionsPerBlock);
  channel.consume(mode, async msg => {
    try {
      const hashToProcess = decodeMessage(msg);
      log(`${walletAddress}: ${hashToProcess}`);
      const txId = await transactionProcessor[contractMethod](hashToProcess);
      log(`Tx: ${txId}`);
      if (logToFile)
        fs.appendFileSync(
          `./log/${walletAddress}.txt`,
          `${new Date()};${Date.now()};${hashToProcess};${txId}\n`
        );
      channel.ack(msg);
    } catch (e) {
      if (logToFile)
        fs.appendFileSync(`./log/${walletAddress}.error.txt`, `${e.stack}\n`);
      channel.nack(msg);
    }
  });
};

module.exports = run;
