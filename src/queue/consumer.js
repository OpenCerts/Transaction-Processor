const debug = require("debug");
const fs = require("fs");
const { createChannel, createConnection, decodeMessage } = require("../utils");
const { MODE, RABBIT_CONNECTION_STRING } = require("../constants");
const SimpleWallet = require("../wallet/simpleWallet");
const MultisigWallet = require("../wallet/multisigWallet");

const log = debug("consumer");
const RECORD_TO_FILE = true;

const run = async ({ mode, privateKey, network, address, multisigWallet }) => {
  const transactionProcessor = multisigWallet
    ? new MultisigWallet({
        network,
        privateKey,
        walletAddress: multisigWallet,
        documentStoreAddress: address
      })
    : new SimpleWallet({
        privateKey,
        network,
        address
      });
  const connection = await createConnection(RABBIT_CONNECTION_STRING);
  const channel = await createChannel(connection);
  const contractMethod = mode === MODE.ISSUE ? "issue" : "revoke";
  const walletAddress = transactionProcessor.wallet.signingKey.address;

  // Allow this worker to process maximum of one transaction at a time
  channel.prefetch(1);
  channel.consume(mode, async msg => {
    try {
      const hashToProcess = decodeMessage(msg);
      log(`${walletAddress}: ${hashToProcess}`);
      const txId = await transactionProcessor[contractMethod](hashToProcess);
      log(`Tx: ${txId}`);
      if (RECORD_TO_FILE)
        fs.appendFileSync(
          `./log/${walletAddress}.txt`,
          `${new Date()};${Date.now()};${txId}\n`
        );
      channel.ack(msg);
    } catch (e) {
      if (RECORD_TO_FILE)
        fs.appendFileSync(`./log/${walletAddress}.error.txt`, `${e.stack}\n`);
      channel.nack(msg);
    }
  });
};

module.exports = run;
