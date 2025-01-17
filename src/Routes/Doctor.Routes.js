const router = require("express").Router();
const {
  getDetailOfthePatient,
  loginDoctor,
  getDoctorData,
  setCriteria,
  manualUpdate,
  spealisesIn,
  prescribeMedicine,
  quallification,
  fetchSidebarContent,
} = require("../Controllers/Doctor.Controller");
const {
  createUser,
  loginUser,
  logout,
  forgotPass,
  refreshToken,
  refreshAccessToken,
} = require("../Controllers/Authentication.Controllers");
const {
  deoctorAuthentiaction,
  verifyAuthorityUser,
  authentication,
} = require("../Middleware/auth.Middleware");
const { body } = require("express-validator");
const upload = require("../Middleware/Multer.Middleware");
const { cacheMiddlWare, setCahe } = require("../Middleware/Caching.Middleware");

//create user
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
      })
      .withMessage("Name is too short"),

    body("email").isEmail().withMessage("Invalid email address"),

    body("password").isLength({ min: 5 }).withMessage("Password is too short"),

    body("phone")
      .custom((value) => {
        if (!value && value.trime().length < 10) {
          throw new Error("invalid phone number");
        }
        return true;
      })
      .withMessage("invalid phone number"),
    body("address")
      .custom((value) => {
        if (!value) {
          throw new Error("address field is required");
        }
        return true;
      })
      .withMessage("address field is required"),
    body("role")
      .custom((value) => {
        if (!value) {
          throw new Error("role is required");
        }
        return true;
      })
      .withMessage("role is required"),
  ],
  createUser
);
//login user
router.post(
  "/login",
  [
    body("email")
      .custom((value) => {
        if (!value) {
          throw new Error("email field is empty");
        }
        return true;
      })
      .withMessage("email field is required"),
    body("password").custom((value) => {
      if (!value) {
        throw new Error("password is required");
      }
    }),
  ],
  loginUser
);
//logout
router.post("/logout", deoctorAuthentiaction, logout);
//forgotpass
router.post("/forgotpass", deoctorAuthentiaction, forgotPass);
//refreshToken
router.get("/refreshtoken", refreshAccessToken);
//getdoctor data
router.get(
  "/getDoctordata",
  authentication,
  verifyAuthorityUser,
  getDoctorData
);
//getdetailsofthepatient
router.get(
  "/getAllUser",
  authentication,
  verifyAuthorityUser,
  getDetailOfthePatient
);
//setAvailbility
router.post(
  "/setcriteria",
  [
    body("HowManyPatients")
      .custom((value) => {
        if (!value && value.length === 0) {
          throw new Error("filed cannot be empty or null");
        }
      })
      .withMessage("filed cannot be empty or null"),
    body("day")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),

    body("start")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),

    body("end")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),
  ],
  deoctorAuthentiaction,
  verifyAuthorityUser,
  setCriteria
);
//manuallyupdate
router.post(
  "/updatemanually",
  deoctorAuthentiaction,
  verifyAuthorityUser,
  manualUpdate
);
//specalization
router.post(
  "/spealisesIn",
  deoctorAuthentiaction,
  verifyAuthorityUser,
  spealisesIn
);
//prescripemedecine
router.post(
  "/prescription/:id",
  authentication,
  verifyAuthorityUser,
  prescribeMedicine
);
//collectdocuments
router.post(
  "/collectdocuments",
  upload.fields([
    { name: "MedicalRegistrationCertificate", maxCount: 1 },
    { name: "MBBSDegree", maxCount: 1 },
    { name: "StateMedicalCouncilRegistration", maxCount: 1 },
  ]),
  authentication,
  verifyAuthorityUser,
  quallification
);

// router.get();
module.exports = router;
