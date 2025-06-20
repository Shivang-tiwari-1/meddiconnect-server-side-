const jwt = require("jsonwebtoken");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { GenerateTokens } = require("../Utils/SendToken.utils");
const { options, filterdetail } = require("../../Constants");
const { validation, message } = require("../Utils/VerfiyAuthority");
const {
  create_user_logic,
  login_User_logic,
} = require("../Services/userServices");

exports.createUser = asyncHandler(async (req, res) => {
  console.log(req.body)
  const {
    name,
    email,
    password,
    phone,
    address,
    role,
    gender,
    latitude,
    longitude,
    city,
    country
  } = req.body;
  if (
    name &&
    email &&
    password &&
    phone &&
    address &&
    role &&
    gender &&
    latitude &&
    longitude &&
    city &&
    country
  ) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return message(req, res, 500, "all fields are required");
  }

  console.log("req.file---->", req.file);

  const user = await create_user_logic(req.body, req.file);
  if (user) {
    console.log("test3->passed");
    return res.status(200).json(new ApiResponse(200, user, "user created"));
  } else {
    console.log("test3->failed");
    return message(req, res, 403, "could not create the user");
  }
});
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (email && password && role) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(401).json({ error: "all fields are required" });
  }

  const user = await login_User_logic(req.body);
  if (user) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 403, "password or mail is wrong");
  }

  const { accessToken, refreshToken } = await GenerateTokens(user);
  if (accessToken && refreshToken) {
    console.log("test3-passed");
  } else {
    console.log("test3-failed");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { data: user, accessToken, refreshToken },
        "user logged in"
      )
    );
});
exports.forgotPass = asyncHandler(async (req, res) => {
  const { oldpass, newpass } = req.body;
  if (!oldpass && !newpass) {
    if (oldpass === newpass) {
      return re.status(500).json({ errro: "select a new password" });
    }
    return res.status(401).json({ error: "All fields are required" });
  }

  let user;
  if (req.user.role === "patient") {
    user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({ error: "could not find the user" });
    } else {
      console.log("test2->passed");
    }
  } else {
    user = await User.findById(req.doctor.id);
    if (!user) {
      return res.status(403).json({ error: "could not find the user" });
    } else {
      console.log("test2->passed");
    }
  }

  const copare_old_password = await user?.comparePassword(oldpass);
  if (copare_old_password) {
    console.log("test3->passed");
  } else {
    return res
      .status(500)
      .json({ error: "you enterd the old password choose a new one" });
  }

  const hash_password = await user?.hashPassword(newpass);
  if (hash_password) {
    console.log("test4->passed");
  } else {
    return res.status(500).json({ error: "new pass could not be hashed" });
  }

  const { accessToken, refreshToken } = await GenerateTokens(user);
  if (accessToken && refreshToken) {
    console.log("test4-passed");
  } else {
    console.log("test4-failed");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { data: user, accessToken, refreshToken },
        "user logged in"
      )
    );
});
exports.deleteAccount = asyncHandler(async (req, res) => {
  //have to schedule the account for deletion
  //if before scheduled time the user logds back in that means he will keep the account
});
exports.logout = asyncHandler(async (req, res) => {
  const data = await validation(req, res);
  if (data) {
    console.log("test1->passed", data);
  } else {
    console.log("test1->failed");
    message(req, res, 403, {
      error: "could not retrive the user from the validation",
    });
  }

  let updata_user_data;

  if (req.user) {
    updata_user_data = await User?.findByIdAndUpdate(
      data.id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
  } else {
    updata_user_data = await Doctor?.findByIdAndUpdate(
      data.id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
  }

  if (updata_user_data) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    message(req, res, 403, { error: "could not update the user" });
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "user logged out"));
});
exports.updateUsre = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req?.body;

  const data = await validation();
  if (data) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    message(req, res, 403, {
      error: "could retrive any daat from the validation",
    });
  }

  const newUser = {};
  if (name) {
    newUser.name = name;
  }
  if (email) {
    newUser.email = email;
  }
  if (password) {
    newUser.password = password;
  }
  if (phone) {
    newUser.password = password;
  }
  if (address) {
    newUser.address = address;
  }
  let user;

  if (req.user) {
    user = await User.findByIdAndUpdate(
      data?.id,
      {
        $set: newUser,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    ).select("-_id", "-password", "-refreshToken");
  } else {
    user = await Doctor.findByIdAndUpdate(
      data?.id,
      {
        $set: newUser,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    ).select("-_id", "-password", "-refreshToken");
  }

  return message(req, res, 200, new ApiResponse(200, user, "user updated"));
});
exports.refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshAccesstoken = await req.cookies?.refreshToken;
  if (!refreshAccesstoken) {
    return message(req, res, 500, "could not retrieve the token");
  }
  console.log(refreshAccesstoken);
  const decode = jwt.verify(
    refreshAccesstoken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decode) {
    return message(req, res, 500, { error: "could not decode" });
  }

  const data =
    decode?.role === "doctor"
      ? await Doctor?.findById(decode?.id)
      : await User?.findById(decode?.id);
  if (!data) {
    return message(req, res, 403, { error: "could not find the user" });
  } else if (data.refreshToken !== refreshAccesstoken) {
    return message(req, res, 403, { error: "suspicious attempt" });
  }

  const { accessToken, refreshToken } = await GenerateTokens(data);
  if (!accessToken && !refreshToken) {
    return message(req, res, 500, { error: "could not retrive the token" });
  }

  const filterd = filterdetail(data);
  if (!filterd) {
    return message(req, res, 500, { error: "could not filter the data" });
  }

  const tokens = {
    data: data,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };


  console.log(tokens);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, tokens, "user logged in"));
});
