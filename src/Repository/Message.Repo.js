const Messages = require("../Models/Message.Model");
const ApiError = require("../Utils/Apierror.Utils");
const moment = require("moment");

exports.createMessage = async (senderid, receiverid, role, message) => {
  console.log(role)
  const save_to_db = await Messages.create({
    sender: senderid,
    receiver: receiverid,
    role: role,
    message: message,
  });
  if (save_to_db) {
    return save_to_db;
  } else {
    throw new ApiError(403, "could not create the message");
  }
};

exports.get_All_messages_of_user = async (id) => {
  const looking = await Messages.find({ receiver: id, role: "sender" }).sort(
    (a, b) => moment(a.createdAt).diff(moment(b.createdAt))
  );
  if (looking) {
    return looking;
  } else {
    throw ApiError(403, "could not find any messages");
  }
};

exports.count_messages = async () => {};
