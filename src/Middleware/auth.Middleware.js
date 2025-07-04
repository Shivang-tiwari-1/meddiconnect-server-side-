const jwt = require("jsonwebtoken");
const Doctor = require("../Models/Doctor.Model");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const User = require("../Models/User.Model");
const { getLineNumber } = require("../Utils/ErrorAtLine");
const { message } = require("../Utils/VerfiyAuthority");
const { default: mongoose } = require("mongoose");
const ApiError = require("../Utils/Apierror.Utils");
const { ObjectId } = require("mongoose").Types;

exports.authentication = asyncHandler(async (req, res, next) => {
  console.log("|authentication starts|");
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies.accessToken;
  if (tokenFromHeader !== null) {
    console.log("test1-token-passed");
  } else {
    console.log("test1-token-failed");
    throw new ApiError(400, "no token found");
  }

  const decode = jwt.verify(tokenFromHeader, process.env.GENERATE_TOKEN_SECRET);
  if (decode) {
    console.log("test2-token-passed");
  } else {
    console.log("test2-token-failed");
    return message(req, res, 500, "invalid token user id");
  }

  if (decode?.role === "patient") {
    const data = await User.findById(decode.id);
    if (data) {
      console.log("test3-token-passed");
    } else {
      console.log("test3-token-failed");
      return message(req, res, 403, { error: "login please" });
    }
    req.user = data;
  } else {
    const data = await Doctor.findById(decode.id);
    if (data) {
      console.log("test3-token-passed");
    } else {
      console.log("test3-token-passed");
      return message(req, res, 403, "could not find the user");
    }
    req.doctor = data;
  }

  console.log("|authentication end|");
  next();
});

exports.deoctorAuthentiaction = asyncHandler(async (req, res, next) => {
  console.log("|doctor-authentication starts|");

  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    console.log("test1-token-passed");
  } else {
    console.log("test2-token-failed");
    return res.status(400).json({ error: "please login" });
  }

  const decode = jwt.verify(token, process.env.GENERATE_TOKEN_SECRET);
  if (decode) {
    console.log("test2-token-passed");
  } else {
    console.log("test2-token-failed");
    return res.status(400).json({ error: "could not decode token" });
  }

  const data = await Doctor.findById(decode.id);
  if (data) {
    console.log("test3-token-passed");
  } else {
    console.log("test3-token-passed");
    return message(req, res, 403, "could not find the user");
  }

  req.doctor = data;

  console.log("|doctor-authentication ends|");

  next();
});

exports.validation = asyncHandler(async (req, res, next) => {
  let find_Doctor;
  let find_User;

  if (req.params?.id) {
    find_Doctor = await Doctor.findById(req.params.id);
    if (!find_Doctor) {
      find_User = await User.findById(req.params.id);
      if (!find_User) {
        return res.status(404).json({
          error: `User with ID ${
            req.params.id
          } could not be found at file ${__filename} at line ${getLineNumber()}.`,
        });
      }
    } else {
      return res.status(404).json({
        error: `entitly could not be found at file ${__filename} at line ${getLineNumber()}`,
      });
    }
  } else if (req.user) {
    find_User = await User.findById(req.user?.id);
    if (find_User) {
      return res.status(404).json({
        error: `User could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    }
  } else if (req.doctor) {
    find_Doctor = await Doctor.findById(req.doctor?.id);
    if (!find_Doctor) {
      return res.status(404).json({
        error: `doctor could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    }
  }
  next();
});

exports.verifyAuthorityUser = asyncHandler(async (req, res, next) => {
  if (req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized To Acess This Resource" });
  } else {
    console.log("verify-authority-passed");
  }
  next();
});
