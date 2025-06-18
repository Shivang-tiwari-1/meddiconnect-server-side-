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
  authentication,
  verifyAuthorityUser,
  setCriteria
);
//manuallyupdate
router.post(
  "/updatemanually",
  authentication,
  verifyAuthorityUser,
  manualUpdate
);
//specalization
router.post(
  "/spealisesIn",
  authentication,
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
