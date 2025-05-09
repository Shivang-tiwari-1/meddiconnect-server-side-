const { default: mongoose } = require("mongoose");
const Doctor = require("../Models/Doctor.Model");
const Messages = require("../Models/Message.Model");
const ApiError = require("../Utils/Apierror.Utils");
const moment = require("moment");
const { unique } = require("agenda/dist/job/unique");
const User = require("../Models/User.Model");

exports.createMessage = async (senderid, receiverid, role, message) => {
  console.log(role);
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
exports.get_all_related_message = async (docid, patid) => {
  const fetch = await Messages.find({
    sender: patid,
    receiver: docid,
  }).sort({ createdAt: 1 });

  if (fetch) {
    return fetch;
  } else {
    throw new ApiError(403, "could not get the message");
  }
};
exports.get_chatting_pat = async (docid) => {
  const pipeline = await Doctor.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(`${docid}`),
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "_id",
        foreignField: "receiver",
        as: "result",
      },
    },
    {
      $unwind: {
        path: "$result",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        uniqueIds: { $addToSet: "$result.sender" },
      },
    },
    {
      $addFields: {
        uniqueIds: { $ifNull: ["$uniqueIds", []] },
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userID: "$uniqueIds" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userID"] },
            },
          },
        ],
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: "$userDetails",
      },
    },
    {
      $match: {
        _id: { $exists: true },
      },
    },
    {
      $project: {
        uniqueIds: 0,
      },
    },
  ]);
  const result = pipeline.flat();
  if (result) {
    return result;
  } else {
    throw new ApiError(403, "could not get the patients");
  }
};
exports.get_chatting_doc = async (patid) => {
  const pipeline = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(`${patid}`),
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "_id",
        foreignField: "receiver",
        as: "result",
      },
    },
    {
      $unwind: {
        path: "$result",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: null,
        uniqueIds: { $addToSet: "$result.sender" },
      },
    },
    {
      $lookup: {
        from: "doctors",
        let: { docId: "$uniqueIds" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$docId"],
              },
            },
          },
        ],
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: "$userDetails",
      },
    },
    {
      $match: {
        _id: { $exists: true },
      },
    },
    {
      $project: {
        uniqueIds: 0,
      },
    },
  ]);
  console.log(`pipeline-----------------<${pipeline}>---------------`,pipeline,patid);
  if (pipeline) {
    return pipeline;
  } else {
    throw new ApiError(403, "could not get the patients");
  }
};
exports.count_messages = async () => {};
