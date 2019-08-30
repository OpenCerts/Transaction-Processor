const { spawn } = require("child_process");

const spawnProcessor = ({
  privateKey,
  mode,
  multisigWalletAddress,
  documentStoreAddress,
  network
}) => {
  const childProcess = spawn("node", [
    ".",
    "processJobs",
    mode,
    "MULTISIG",
    documentStoreAddress,
    privateKey,
    multisigWalletAddress,
    "--network",
    network
  ]);

  childProcess.stdout.on("data", data => {
    console.log(data.toString());
  });

  childProcess.stderr.on("data", data => {
    console.error(data.toString());
  });

  childProcess.on("exit", function(code) {
    console.error("child process exited with code " + code);
    spawnProcessor({
      privateKey,
      mode,
      multisigWalletAddress,
      documentStoreAddress,
      network
    });
  });
};

const spawnProcessors = ({
  accounts,
  mode,
  multisigWalletAddress,
  documentStoreAddress,
  network
}) => {
  accounts.forEach(({ privateKey }) => {
    spawnProcessor({
      privateKey,
      mode,
      multisigWalletAddress,
      documentStoreAddress,
      network
    });
  });
};

module.exports = { spawnProcessors };
