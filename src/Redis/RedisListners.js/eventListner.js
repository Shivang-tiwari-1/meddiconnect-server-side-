const { sub } = require("../../../Constants");
const ApiError = require("../../Utils/Apierror.Utils");

exports.sending_data = (data, objective) => {
  if (!data?.io) {
    throw new ApiError(404, "data is missing something");
  }
  sub.once("message", async (channel, Data) => {
    switch (channel) {
      case "patient_information_channel":
        if (objective === "online_Status") {       
          data?.io
            .to("patient_information")
            .emit("patient_Information", { Data, objective });
        } else if (objective === "offline_status") {
          data?.io
            .to("patient_information")
            .emit("patient_Information", { Data, objective });
        } else if (objective === "redis_messages") {
          data?.io
            .to(data?.reciverSocketid)
            .emit("patient_Information", { Data, objective, role: data.role });
        }
        break;

      case "chatbox":
        if (objective === "text_message") {
          data.io.to(data?.reciverSocketid).emit("listen_to_message", {
            role: data?.role,
            text: Data,
            user_Role: data?.user_Role,
          });
        }
        break;

      case "doctor_information_channel":
        break;
    }
  });
  data?.io.to(data?.reciverSocketid).emit("liveMessage", data?.message);
  return true;
};
