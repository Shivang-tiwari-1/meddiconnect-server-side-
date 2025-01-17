const moment = require("moment");
const { get_All_messages_of_user } = require("../Repository/Message.Repo");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");

exports.getMessages_logic = async (req) => {
  const getting_message = await get_All_messages_of_user(req.user.id);
  if (getting_message) {
    console.log("test1->passed");
    return new ApiResponse(200, getting_message, "messages fetched");
  } else {
    console.log("test1->failed");
    throw new ApiError(500, "function could not produce the expected result");
  }
};
