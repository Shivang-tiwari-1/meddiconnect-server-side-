const mongoose = require("mongoose");
const { DB_NAME } = require("../../Constants");
const ApiError = require("../Utils/Apierror.Utils");

exports.connectToMongo = async () => {
  try {
      console.log("⛳ Mongo URI being used:", process.env.MONGO_URL);
    const connectionInstance = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      "\n Mongoose connected !! DB host: ",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("|||||||||||||||||||||||||||||||||||||||||||||||")
    throw new ApiError(500, `could not connect ${error}`);
  }
};
