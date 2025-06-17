require("dotenv").config();
const cluster = require("cluster");
const sticky = require("sticky-session");
const http = require("http");
const { ioconnection } = require("./src/Db/Socket.Db");
const { connectToMongo } = require("./src/Db/index.db");
const { connect_to_redis } = require("./src/Db/Redis.cache.db");
const app = require("./src/App");
const server = http.createServer(app);
const { setSocket } = require("./Constants");
const {
  pub_sub_channle_Export,
} = require("./src/Redis/PublishChannles/chnnleExport");
const { agenda } = require("./src/ScheduleTasks/agend.ScheduleTasks");

setSocket(server);

async function initialize() {
  console.log("🔄 Starting initialization...");

  try {
    await connectToMongo();
    console.log("✅ Mongo connected");

    await connect_to_redis();
    console.log("✅ Redis connected");

    await agenda.start();
    console.log("✅ Agenda started");

    console.log("🚀 Initialization complete");
  } catch (error) {
    console.error("❌ Error during initialization:", error);
    process.exit(1); 
  }
}


ioconnection();

(async () => {
  await initialize(); 
})();

if (!sticky.listen(server, process.env.PORT || 8000)) {
  console.log("Master process PID:", process.pid);

  pub_sub_channle_Export();

  const numCPUs = require("os").availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  server.listen(() => {
    console.log(`Worker running on http://localhost:${process.env.PORT}`);
  });

  process.on("uncaughtException", (err) => {
    console.error("Worker died due to uncaught exception:", err);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log(`Received SIGINT, exiting gracefully...`);
    process.exit(0);
  });
}
