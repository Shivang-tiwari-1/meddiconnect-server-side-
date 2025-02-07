require("dotenv").config();
const cluster = require("cluster");
const sticky = require("sticky-session");
const http = require("http");
const { ioconnection } = require("../backend/src/Db/Socket.Db");
const { connectToMongo } = require("./src/Db/index.db");
const { connect_to_redis } = require("./src/Db/Redis.cache.db");
const app = require("./src/App");
const server = http.createServer(app);
const { setSocket } = require("./Constants");
const processMissedJobs = require("./src/ScheduleTasks/startAgenda");
const {
  pub_sub_channle_Export,
} = require("./src/PublishChannles/chnnleExport");

setSocket(server);

async function initialize() {
  try {
    await connectToMongo();
    await connect_to_redis();
    console.log("Databases connected successfully");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

ioconnection();

if (!sticky.listen(server, process.env.PORT || 8000)) {
  console.log("Master process PID:", process.pid);
  pub_sub_channle_Export();

  // (async () => {
  //   await processMissedJobs();
  // })();

  const numCPUs = require("os").availableParallelism();

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  console.log(`Worker process PID: ${process.pid}`);
  server.listen(async () => {
    await initialize();
    console.log(`Worker running on http://localhost:${process.env.PORT}`);
    await processMissedJobs();
  });

  process.on("uncaughtException", (err) => {
    console.error("Worker died due to uncaught exception:", err);
    process.exit(1);
  });
}
