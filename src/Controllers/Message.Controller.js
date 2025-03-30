const {
  getMessages_logic,
  fetchmessagePatients_logic,
  fetchmessageDoctors_logic,
  fetch_pat_text_to_doc,
  fetch_doc_text_to_doc,
} = require("../Services/Messages.Services");
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
exports.patient_chat = asyncHandler(async (req, res) => {
  const { redisKey } = req.query;
  const { id } = req.params;
  console.log(req.params);
  if (!redisKey || !id) {
    throw new ApiError(404, "meta data missing");
  }
  const getting_msg = await fetchmessagePatients_logic(
    req.user?.id,
    redisKey,
    id
  );
  if (!getting_msg) {
    throw new ApiError(500, "logic failed to fetch the messages");
  }
});
exports.doctor_chat = asyncHandler(async (req, res) => {
  const { redisKey } = req.query;
  const { docid } = req.params;
  if (redisKey || docid) {
    throw new ApiError(404, "meta data missing");
  }

  const getting_msg = await fetchmessageDoctors_logic(
    req.doctor?.id,
    redisKey,
    docid
  );
  if (!getting_msg) {
    throw new ApiError(500, "logic failed to fetch the messages");
  }
});

exports.patients_texted_to_doc = asyncHandler(async (req, res) => {
  console.log("congrat reached here ")
  const { redisKey } = req.query;
  if (!redisKey) {
    throw new ApiError(404, "bad request (redis key not found)");
  }
 
  const fetching = await fetch_pat_text_to_doc(req.doctor.id, redisKey);
  if (fetching) {
    return res.status(200).json(new ApiResponse(200, fetching, "data fetched"));
  } else {
    throw new ApiError(500, "function failed to produce the expected result ");
  }
});
exports.doctors_texted_to_pat = asyncHandler(async (req, res) => {
  const { redisKey } = req.query;
  console.log("-----------<>", req.query);

  if (!redisKey) {
    throw new ApiError(404, "bad request (redis key not found)");
  }

  const fetching = await fetch_doc_text_to_doc(req.user.id, redisKey);
  if (fetching) {
    console.log("---------------------->", fetching);

    return res.status(200).json(new ApiResponse(200, fetching, "data fetched"));
  } else {
    throw new ApiError(500, "function failed to produce the expected result ");
  }
});
