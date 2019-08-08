#!/usr/bin/env node
const yargs = require("yargs");
const producer = require("./queue/producer");
const consumer = require("./queue/consumer");
const { spawnProcessors } = require("./processes/spawn");

// Pass argv with $1 and $2 sliced
const parseArguments = argv =>
  yargs
    .usage(
      "OpenAttestation DocumentStore load generator and consumer. Please run a rabbitmq management server to schedule the queues."
    )
    .strict()
    .epilogue(
      "The common subcommands you might be interested in are:\n" +
        "- createJobs\n" +
        "- processJob\n"
    )
    .options({
      network: {
        choices: ["homestead", "ropsten"],
        default: "ropsten",
        description: "Network to perform transaction on",
        global: true,
        type: "string"
      }
    })
    .command({
      command: "createJobs [mode] [pollingTime] [queueLimit] [options]",
      description: "Obfuscate fields in the certificate",
      builder: sub =>
        sub
          .positional("mode", {
            description: "To issue or revoke document",
            choices: ["REVOKE", "ISSUE"],
            default: "ISSUE"
          })
          .positional("pollingTime", {
            description: "Time between adding job (producer only)",
            type: "number",
            default: 10000
          })
          .positional("queueLimit", {
            description: "Maximum number of jobs in the queue (producer only)",
            type: "number",
            default: 100
          })
    })
    .command({
      command:
        "processJobs <mode> <address> <privateKey> [multisigWallet] [options]",
      description: "Obfuscate fields in the certificate",
      builder: sub =>
        sub
          .positional("mode", {
            description: "To issue or revoke document",
            choices: ["REVOKE", "ISSUE"]
          })
          .positional("address", {
            description: "Contract address of documentStore",
            default: "string"
          })
          .positional("privateKey", {
            description: "Time between adding job (producer only)",
            type: "string"
          })
          .positional("multisigWallet", {
            description:
              "Address of Gnosis Multisig Wallet controlling the DocumentStore",
            type: "string"
          })
    })
    .command({
      command:
        "multiAccountProcessor <mode> <address> <multisigWallet> [options]",
      description:
        "Use multiple accounts from .secret/accounts.json file to process",
      builder: sub =>
        sub
          .positional("mode", {
            description: "To issue or revoke document",
            choices: ["REVOKE", "ISSUE"]
          })
          .positional("address", {
            description: "Contract address of documentStore",
            default: "string"
          })
          .positional("privateKey", {
            description: "Time between adding job (producer only)",
            type: "string"
          })
          .positional("multisigWallet", {
            description:
              "Address of Gnosis Multisig Wallet controlling the DocumentStore",
            type: "string"
          })
    })
    .parse(argv);

const createJobs = async ({ mode, pollingTime, queueLimit }) => {
  await producer({ mode, pollingTime, queueLimit });
};

const processJobs = async ({
  mode,
  privateKey,
  network,
  address,
  multisigWallet
}) => {
  await consumer({ mode, privateKey, network, address, multisigWallet });
};

const multiAccountProcessor = async ({ mode, address, multisigWallet, network }) => {
  const accounts = require("../.secret/accounts.json");
  await spawnProcessors({
    accounts,
    mode,
    multisigWalletAddress: multisigWallet,
    documentStoreAddress: address,
    network
  });
};

const main = async argv => {
  const args = parseArguments(argv);

  if (args._.length !== 1) {
    yargs.showHelp("log");
    return false;
  }

  switch (args._[0]) {
    case "createJobs":
      return createJobs(args);
    case "processJobs":
      return processJobs(args);
    case "multiAccountProcessor":
      return multiAccountProcessor(args);
    default:
      throw new Error(`Unknown command ${args._[0]}. Possible bug.`);
  }
};

main(process.argv.slice(2));
