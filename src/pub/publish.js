const { pub } = require("../../Constants");

function publishMessage(channel, message) {
  pub.publish(channel, message, (err) => {
    if (err) {
      console.error("Failed to publish message:", err);
    } else {
      console.log(`Message published to channel "${channel}": ${message}`);
    }
  });
}


publishMessage("my-channel", "Hello from Publisher!");
