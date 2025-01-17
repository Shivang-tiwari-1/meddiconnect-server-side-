const { client } = require("../../Constants");

exports.connect_to_redis = async (server) => {

  try {
    client.on("error", (err) => {
      console.error("redis client erro", err);
      if ((err.code = "ECONNREFUSED")) {
        return false;
      }
    });
    await client
      .connect()
      .then(() =>
        console.log(
          `connected to redis server at :${client.options.socket.host}:${client.options.socket.port}`
        )
      );
  } catch (error) {
    console.error(`Redis connection error: ${error.message}`);
    return false;
  }
};
