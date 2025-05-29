const jwt = require("jsonwebtoken");
const { message } = require("../Utils/VerfiyAuthority");

exports.refreshAccessToken_logic = async (refreshtoken) => {
  const decode = jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);
  if (!decode) {
    return message(req, res, 500, { error: "could not decode" });
  }

  const data =
    decode?.role === "doctor"
      ? await Doctor?.findById(decode?.id)
      : await User?.findById(decode?.id);
  if (!data) {
    return false;
  } else {
    return true;
  }
};
