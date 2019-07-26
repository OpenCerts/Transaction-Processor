const MODE = {
  ISSUE: "ISSUE",
  REVOKE: "REVOKE"
};
const RABBIT_CONNECTION_STRING = "amqp://rabbitmq:rabbitmq@localhost:5672/";

module.exports = { MODE, RABBIT_CONNECTION_STRING };
