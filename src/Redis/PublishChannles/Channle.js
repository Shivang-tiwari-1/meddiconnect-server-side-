const { pub } = require("../../../Constants");
const ApiError = require("../../Utils/Apierror.Utils");

exports.ui_update = () => {
  pub.publish("ui_update", "subscribed to channel-(ui_update)", (err) => {
    if (err) {
      throw new ApiError(404, "could not publish the channel (ui_update)");
    } else {
      console.log("**********channel-published(ui_update)*************");
    }
  });
};
exports.state_active = () => {
  pub.publish(
    "is_active_ui_update",
    "subscribed to channel-(active_notation_ui_update)",
    (err) => {
      if (err) {
        throw new ApiError(
          404,
          "could not publish the channel (active_notation_ui_update)"
        );
      } else {
        console.log(
          "**********channel-published(active_notation_ui_update)*************"
        );
      }
    }
  );
};
exports.message_channel = () => {
  pub.publish("chatbox", "subscribed to channel-(chatbox)", (err) => {
    if (err) {
      throw new ApiError(404, "could not publish the channel (chatbox)");
    } else {
      console.log("**********channel-published(chatbox)*************");
    }
  });
};
exports.publish_message_to_channel = (message) => {
  pub.publish("chatbox", message, (err) => {
    if (err) {
      throw new ApiError(404, `could not publish the message:${err}`);
    } else {
      console.log("**********message-published-to-(chatbox)*************");
    }
  });
};
exports.publish_patient_channel = () => {
  pub.publish(
    "patient_information_channel",
    "subscribed to channel-(patient_information_channel)",
    (err) => {
      if (err) {
        throw new ApiError(404, `could not publish the channel:${err}`);
      } else {
        console.log(
          "**********channel-published-to-(patient_information_channel)*************"
        );
      }
    }
  );
};
exports.publish_doctor_channel = () => {
  pub.publish(
    "doctor_information_channel",
    "subscribed to channel-(publish_doctor_channel)",
    (err) => {
      if (err) {
        throw new ApiError(404, `could not publish the channel:${err}`);
      } else {
        console.log(
          "**********channel-published-to-(doctor_information_channel)*************"
        );
      }
    }
  );
};
