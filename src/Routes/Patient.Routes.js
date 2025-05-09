const router = require("express").Router();
const {
  fetchAllDoctors,
  BookAppointment,
  CancleAppointment,
  getuserData,
  History,
  BookAppointmentManually,
  getDoctorDetails,
  fetchSidebarContent,
  find_the_nearest,
} = require("../Controllers/Patient.Controller");
const {
  createUser,
  loginUser,
  logout,
  forgotPass,
  refreshAccessToken,
} = require("../Controllers/Authentication.Controllers");
const { authentication } = require("../Middleware/auth.Middleware");
const { cacheMiddlWare } = require("../Middleware/Caching.Middleware");

router.get("/getData", authentication, cacheMiddlWare, getuserData);
router.get("/fetchalldoctors", authentication, cacheMiddlWare, fetchAllDoctors);
router.post(
  "/makeappointment/:id",
  authentication,
  (req, res, next) => {
    req.isBookingAppointment = true;
    next();
  },
  BookAppointment
);
router.post("/cancleappointment/:id", authentication, CancleAppointment);
router.get("/history", authentication, History);
router.post(
  "/makeappointment_manually/:id",
  authentication,
  (req, res, next) => {
    req.isBookingAppointment = true;
    next();
  },
  BookAppointmentManually
);
router.get("/doctorDetail/:id", authentication, getDoctorDetails);
router.get("/fetchsidebarcontent", fetchSidebarContent);
router.get("/nearest", authentication, cacheMiddlWare, find_the_nearest);
module.exports = router;
