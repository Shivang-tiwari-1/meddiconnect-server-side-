const mongoose = require("mongoose");
const { DB_NAME } = require("../../Constants");
const ApiError = require("../Utils/Apierror.Utils");

exports.connectToMongo = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;

    if (!mongoUrl) {
      console.error("❌ MONGO_URL is not defined. Exiting.");
      process.exit(1); // Immediately stop the app
    }

    console.log("⛳ Mongo URI being used:", mongoUrl);

    const connectionInstance = await mongoose.connect(mongoUrl);

    console.log(
      "\n✅ Mongoose connected! DB host:",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("|||||||||||||||||||||||||||||||||||||||||||||||");
    throw new ApiError(500, `Could not connect to MongoDB: ${error.message}`);
  }
};
