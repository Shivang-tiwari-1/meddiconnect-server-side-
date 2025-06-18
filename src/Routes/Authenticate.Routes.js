const router = require("express").Router();
const {
  createUser,
  loginUser,
  logout,
  forgotPass,
  refreshAccessToken,
} = require("../Controllers/Authentication.Controllers");

const { body } = require("express-validator");
const upload = require("../Middleware/Multer.Middleware");
const { authentication } = require("../Middleware/auth.Middleware");

router.post(
  "/createuser",
  upload.single("profileImage"),
  [
    body("name")
      .custom((value) => {
        if (!value || value.trim().length <= 3) {
          throw new Error("Name is too short");
        }
        return true;
      }),

    body("email").isEmail().withMessage("Invalid email address"),

    body("password").isLength({ min: 5 }).withMessage("Password is too short"),

    body("phone")
      .custom((value) => {
        if (!value || value.trim().length < 10) {
          throw new Error("Invalid phone number");
        }
        return true;
      }),

    body("address")
      .notEmpty()
      .withMessage("Address field is required"),

    body("role")
      .notEmpty()
      .withMessage("Role is required"),
  ],
  createUser
);

router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("Email field is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

router.post("/refreshtoken", refreshAccessToken);
router.post("/logout", authentication, logout);
router.post("/forgotpass", authentication, forgotPass);

module.exports = router;
