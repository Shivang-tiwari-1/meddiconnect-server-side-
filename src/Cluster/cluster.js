const cluster = require("cluster");
const { socketCollection } = require("../../Constants");

exports.spawn_Workers = async () => {
  const worker = cluster.fork();

  worker.on("exit", (code, signal) => {

  });
};
