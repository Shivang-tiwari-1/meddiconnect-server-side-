const { sub } = require("../../Constants");

function Subscribe_channel(channel) {
  sub.subscribe(channel, (err, count) => {
    if (err) {
      console.error("Failed to subscribe:", err);
    } else {
      console.log(
        `Subscribed to ${count} channel(s). Listening for updates on "${channel}"...`
      );
    }
  });

  sub.on("message", (channel, message) => {
    console.log(`Received message from channel "${channel}": ${message}`);
  });
}
Subscribe_channel("my-channel");
