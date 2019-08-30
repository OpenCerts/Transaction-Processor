const amqp = require("amqplib/callback_api");
const axios = require("axios");
const ethers = require("ethers");

const encodeMessage = messageObject =>
  Buffer.from(JSON.stringify(messageObject));

const decodeMessage = messageRaw => JSON.parse(messageRaw.content.toString());

const getJobsInQueues = async ({
  username,
  password,
  url = "http://localhost:15672/"
}) => {
  const res = await axios.get(`${url}api/queues`, {
    auth: {
      username,
      password
    }
  });
  const queues = {};
  res.data.forEach(queue => {
    queues[queue.name] = queue.messages;
  });
  return queues;
};

const createConnection = connectionString => {
  return new Promise((resolve, reject) => {
    amqp.connect(connectionString, (err, connection) => {
      if (err) return reject(err);
      resolve(connection);
    });
  });
};

const createChannel = connection => {
  return new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
      if (err) return reject(err);
      resolve(channel);
    });
  });
};

const getProvider = (network = "ropsten") =>
  network === "local"
    ? new ethers.providers.JsonRpcProvider("http://localhost:8545")
    : ethers.getDefaultProvider(network);

module.exports = {
  getJobsInQueues,
  createChannel,
  createConnection,
  encodeMessage,
  decodeMessage,
  getProvider
};
