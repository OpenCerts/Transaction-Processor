const debug = require("debug");
const { createChannel, createConnection, decodeMessage } = require("./utils");
const { MODE, RABBIT_CONNECTION_STRING } = require("./constants");
const SimpleWallet = require("./wallet/simpleWallet");
const MultisigWallet = require("./wallet/multisigWallet");

const log = debug("consumer");

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

  // Allow this worker to process maximum of one transaction at a time
  channel.prefetch(1);
  channel.consume(mode, async msg => {
    const hashToProcess = decodeMessage(msg);
    log(`${mode}: ${hashToProcess}`);
    const txId = await transactionProcessor[contractMethod](hashToProcess);
    log(`Transaction Hash: ${txId}`);
    channel.ack(msg);
  });
};

module.exports = run;
