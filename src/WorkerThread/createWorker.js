const { Worker } = require("worker_threads");

exports.createWorker = (dataChunk) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", {
      workerData: { data: dataChunk, thread_count: process.env.THREAD_COUNT },
    });
    Worker.on("message", (data) => {
      resolve(data);
    });
    worker.on("error", (msg) => reject(`An error occurred: ${msg}`));
  });
};
