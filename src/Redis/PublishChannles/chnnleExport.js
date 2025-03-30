const { ui_update, state_active, message_channel, publish_patient_channel, publish_doctor_channel } = require("./Channle");

exports.pub_sub_channle_Export = () => {
  ui_update();
  state_active();
  message_channel();
  publish_patient_channel();
  publish_doctor_channel();
};
