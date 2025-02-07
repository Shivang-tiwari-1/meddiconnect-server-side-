const { pub } = require("../../Constants");

exports.ui_update = () => {
  pub.publish("ui_update", "subscribed to the channel", (err, count) => {
    if (err) {
      throw new ApiError(404, "could not publish the channel (ui_update)");
    } else {
      console.log("**********channel-published*************");
    }
  });
};
