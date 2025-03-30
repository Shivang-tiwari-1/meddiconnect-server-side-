const {
  get_All_messages_of_user,
  get_all_related_message,
  get_chatting_pat,
  get_chatting_doc,
} = require("../Repository/Message.Repo");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { findDoctorId, findPatientId } = require("../Repository/userRepository");
const { setCahe } = require("../Middleware/Caching.Middleware");
const { filterdetail } = require("../../Constants");

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
exports.fetchmessagePatients_logic = async (patid, redisKey, docid) => {
  const find_pat = await findPatientId(patid);
  if (find_pat) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    throw new ApiError(500, "function failed to get the user");
  }

  const find_Doc = await findDoctorId(docid);
  if (find_Doc) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    throw new ApiError(500, "failed to fetch the doctor");
  }
  const getting_all_related_message = await get_all_related_message(
    find_Doc?.id,
    find_pat?.id
  );
  if (getting_all_related_message) {
    console.log("test3->passed");
    setCahe(redisKey, getting_all_related_message, find_pat?.id);
    return getting_all_related_message;
  } else {
    console.log("test3->failed");
    throw new ApiError(500, "function failed tp fetch the related message ");
  }
};
exports.fetchmessageDoctors_logic = async (docid, redisKey, patid) => {
  const find_pat = await findPatientId(
    typeof patid !== "string" && String(patid)
  );
  if (find_pat) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    throw new ApiError(500, "function failed to get the user");
  }

  const find_doc = await findDoctorId(
    typeof docid !== "string" && String(docid)
  );
  if (find_doc) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    throw new ApiError(500, "failed to fetch the doctor");
  }

  const getting_all_related_message = await get_all_related_message(
    String(find_doc?._id),
    String(find_pat?._id)
  );
  if (getting_all_related_message) {
    console.log("test3->passed");
    setCahe(redisKey, getting_all_related_message, String(find_doc?._id));
  } else {
    console.log("test3->failed");
    throw new ApiError(500, "function failed tp fetch the related message ");
  }
};
exports.fetch_pat_text_to_doc = async (docid, query) => {
  console.log("rwached services ")
  if (typeof !docid && !query) {
    throw new ApiError(404, "rediskey & dcoid required");
  }

  const get_the_pat = await get_chatting_pat(docid);
  if (get_the_pat) {
    console.log("test1->passed", get_the_pat);
      console.log("--------------->", get_the_pat);
    setCahe(query, get_the_pat, docid);
    
    return get_the_pat;
  } else {
    console.log("test1->failed");
    throw new ApiError(500, "failed to get the chatting patients");
  }
};

exports.fetch_doc_text_to_doc = async (patid, redisKey) => {
  const get_the_doc = await get_chatting_doc(String(patid));
  if (get_the_doc) {
    setCahe(redisKey, get_the_doc, String(patid));

    return get_the_doc;
  } else {
    console.log("test1->failed");
    throw new ApiError(500, "failed to get the chatting patients");
  }
};
