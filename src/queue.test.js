var Queue = require("better-queue");

const wait = timeout =>
  new Promise(resolve => {
    setTimeout(resolve, timeout);
  });

it("works", async () => {
  var q = new Queue(
    (stuff, cb) => {
      // Some processing here ...
      console.log(stuff);
      cb(null, 12);
    },
    { batchSize: 128, batchDelay: 2000, batchDelayTimeout: 1000 }
  );
  q.on("task_finish", console.log);

  setInterval(() => {
    const hash = Math.random();
    q.push({ hash }, () => {
      console.log("IM DONE: ", hash);
    });
  }, 500);

  await wait(5000);
}, 10000);
