const {
  patient_chat,
  doctor_chat,
  patients_texted_to_doc,
  doctors_texted_to_pat,
} = require("../Controllers/Message.Controller");
const { authentication } = require("../Middleware/auth.Middleware");
const { cacheMiddlWare } = require("../Middleware/Caching.Middleware");

const router = require("express").Router();

router.get("/patient_chat/:id", authentication, cacheMiddlWare, patient_chat);
router.get("/doctor_chat/:id", authentication, cacheMiddlWare, doctor_chat);
router.get(
  "/chatting_patinets_to_doc",
  authentication,
  cacheMiddlWare,
  patients_texted_to_doc
);
router.get(
  "/chatting_doctor_to_pat",
  authentication,
  cacheMiddlWare,
  doctors_texted_to_pat
);

module.exports = router;
