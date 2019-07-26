const uuid = require("uuid/v4");
const { keccak256 } = require("js-sha3");
const debug = require("debug");
const {
  encodeMessage,
  createChannel,
  createConnection,
  getJobsInQueues
} = require("./utils");
const { MODE, RABBIT_CONNECTION_STRING } = require("./constants");

const debugProducer = debug("producer");
const DEFAULT_POLLING_TIME = 10000; // Checks every 10 sec to see if there is enough jobs in queue
const DEFAULT_QUEUE_LIMIT = 100; // Maximum number of jobs in the queue

const randomHash = () => `0x${keccak256(uuid())}`;

const wait = timeout =>
  new Promise(resolve => {
    setTimeout(resolve, timeout);
  });

const fillQueueWithJobs = async ({ queue, queueLimit, channel }) => {
  const currentQueuesInfo = await getJobsInQueues({
    username: "rabbitmq",
    password: "rabbitmq"
  });
  const jobsInQueue = currentQueuesInfo[queue] || 0;
  const jobsToAdd = queueLimit - jobsInQueue;

  debugProducer(`Adding ${jobsToAdd} jobs to ${queue}`);
  for (let i = 0; i < jobsToAdd; i++) {
    const hashToAdd = randomHash();
    debugProducer(`${queue}: ${hashToAdd}`);
    await channel.sendToQueue(queue, encodeMessage(hashToAdd));
  }
};

const jobsLoop = async ({ pollingTime, queue, queueLimit, channel } = {}) => {
  while (true) {
    await fillQueueWithJobs({ queue, queueLimit, channel });
    await wait(pollingTime);
  }
};

const run = async ({
  mode = MODE.ISSUE,
  pollingTime = DEFAULT_POLLING_TIME,
  queueLimit = DEFAULT_QUEUE_LIMIT
} = {}) => {
  debugProducer(`Running job producer in ${mode} mode...`);
  const connection = await createConnection(RABBIT_CONNECTION_STRING);
  const channel = await createChannel(connection);
  channel.assertQueue(mode);
  await jobsLoop({ queue: mode, channel, pollingTime, queueLimit });
};

module.exports = run;
