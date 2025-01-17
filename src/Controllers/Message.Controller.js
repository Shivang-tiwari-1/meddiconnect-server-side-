const { getMessages_logic } = require("../Services/Messages.Services");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");

exports.get_message_all = asyncHandler(async (req, res) => {
  const getting_message = await getMessages_logic(req);
  if (getting_message) {
    return res
      .status(200)
      .json(new ApiResponse(200, getting_message, "messages fetched"));
  } else {
    throw new ApiError(500, "logic failed");
  }
});
