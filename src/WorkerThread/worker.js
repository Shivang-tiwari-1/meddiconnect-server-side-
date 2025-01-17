const { workerData, parentPort } = require("worker_threads");

const { data, thread_count } = workerData;
let counter = 0;

for (let i = 0; i < data / thread_count; i++) {
  counter++;
}

parentPort.postMessage(counter);
