const ApiResponse = require("../Utils/Apiresponse.utils");
const { filterdetail } = require("../../Constants");
const User = require("../Models/User.Model");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { message } = require("../Utils/VerfiyAuthority");
const {
  book_appointment_logic,
  fetch_All_Doctor_logic,
  boo_Appointment_Manually_logic,
  get_User_data_logic,
  data_logic,
  cancle_Appointment_logic,
  get_Doctor_Details_logic,
  find_the_nearest_doc_logic,
} = require("../Services/patinet.Service");
const { setCahe } = require("../Middleware/Caching.Middleware");

/**************************functions****************************/
//getUserData
//fetchAllDoctor
//BookAppointment
//BookAppointManually
//CancelAppointment
//History
//getDoctorDetails
//nearestDoctor
/**************************functions****************************/
exports.getuserData = asyncHandler(async (req, res) => {
  const getting_User_data = await get_User_data_logic(req.user?.id);
  setCahe(req.query.redisKey, getting_User_data, req.user.id);
  if (getting_User_data) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, getting_User_data, "user fetched successfully")
      );
  }
});
exports.fetchAllDoctors = asyncHandler(async (req, res, next) => {
  //************************************ALGO***************************************/
  //1.find the doctor
  //2.filter the details
  //3.set the cache for the redis middleware to catch it
  //************************************ALGO***************************************/
  const fetching_Doctors = await fetch_All_Doctor_logic();
  console.log(fetching_Doctors);
  if (fetching_Doctors) {
    setCahe(req.query.redisKey, fetching_Doctors, req.user.id);
    return res.json(
      new ApiResponse(200, fetching_Doctors, " doctors near you")
    );
  } else {
    return res
      .status(500)
      .json({ error: "no data received from the filterdetails" });
  }
});
exports.BookAppointment = asyncHandler(async (req, res) => {
  //************************************ALGO***************************************/
  //1.find the patient
  //2.get the current-day
  //3.get the date & time from day_tim management function (returns object  {targetDateTime: targetDateTime,date: targetDateTime.format("MM-DD-YYYY"), }
  //4.check the authority
  //5.check if appointment already exists on the same day date
  //6.store the retrived time in a variable (from day_timemanagement function)
  //7.incriment the patient number for doctor
  //8.update the appointment status for user
  //9.create the appointment
  //************************************ALGO***************************************/

  const appointment_creation = await book_appointment_logic(req);
  if (appointment_creation) {
    console.log("test12->passed");
    return res
      .status(200)
      .json(new ApiResponse(200, null, "appointment booked "));
  } else {
    console.log("test12->failed");
    return res
      .status(403)
      .json({ error: "could not update create the appointment" });
  }
});
exports.BookAppointmentManually = asyncHandler(async (req, res) => {
  //************************************ALGO***************************************/
  //1.retrive  time and day from the body
  //2.get the date and time from the Day_time_managment
  //3.conver the time to ISIO time
  //4.find the patient
  //5.check for authority (returns the doctor_data and current ongoin numner as an object )
  //6.update the doctor availabilty for that time and day
  //7.look for any existing appointment
  //8.if appointment is booked by the user at the same hour and day return false
  //9.extract the data from doctor availability according to date time
  //10.update the patient status
  //11.create an appointment
  //12.send notification to the doctor and the patient
  //************************************ALGO***************************************/

  //1
  const { day, time } = req?.body;
  if (day && time && day.trim(" ") && time.trim(" ")) {
    console.log("test1->passed", day, time);
  } else {
    console.log("test1->failed");
    return res.status(400).json({ error: "all fields are required" });
  }

  const booking_appointment = boo_Appointment_Manually_logic(day, time, req);
  if (booking_appointment && booking_appointment?.success) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, booking_appointment?.message, "appointment booked")
      );
  }
});
exports.CancleAppointment = asyncHandler(async (req, res) => {
  //************************************ALGO***************************************/
  // 1.find the patient
  // 2.find the apointment through req?.params?.id
  // 3.destructure time date aoointmentAt time from find_appointmentn
  // 4.check the authority (returns doctor and current patient number)
  // 5.remove the user object from the db with the same day ,time !==  will contain all appointments except the one that matches
  // 6.assign it to the find_patient?.appointmentStatus
  // 7.save the file
  // 8.update the doctor patient number
  // 9.delete the appointment
  //************************************ALGO***************************************/

  const cancelling = await cancle_Appointment_logic(
    req.user?.id,
    req.params.id
  );
  if (cancelling) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "appointment deleted"));
  }
});
exports.History = asyncHandler(async (req, res) => {
  //1.look for the patient
  //2.convert the object to an array
  //3.isolate all the id`s in an array
  //4.search for all the id`s in the db and collect it in an array
  //5.collect non-identical data in an array
  //6. synatize the data
  let doctorHistories = [];
  let finalResult = [];

  const patient = await User.findById(req.user?.id);
  if (patient) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(req, res, 403, { error: "patient not found" });
  }

  const toarray = Object.entries(patient);
  if (Array.isArray(toarray)) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 500, {
      error: "could not convert it to an array",
    });
  }

  const history = toarray[2][1]?.history
    .map((status) => {
      return status?.doctorId;
    })
    .filter(Boolean);
  if (history.length > 0) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 500, "no history of appoinment");
  }

  if (history && history.length > 0) {
    for (let i = 0; i <= history.length - 1; i++) {
      const doctor_Id = history[i];
      const doctorHistory = await Doctor.findById(doctor_Id);
      if (!doctorHistories) {
        return message(req, res, 403, { error: "could not find the user" });
      }
      doctorHistories.push(doctorHistory);
    }
  }
  if (doctorHistories.length === 0) {
    console.log("test4->failed");
    return message(req, res, 500, {
      error: "ypu havent booked any appointment",
    });
  } else {
    console.log("test4->passsed");
  }

  for (let i = 0; i < doctorHistories?.length; i++) {
    let include = true;
    if (finalResult?.length === 0) {
      finalResult?.push(doctorHistories[i]);
    } else {
      if (
        i < doctorHistories.length - 1 &&
        doctorHistories[i]?.id === doctorHistories[i + 1]?.id
      ) {
        include = false;
      }
      if (include) {
        finalResult?.push(doctorHistories[i]);
      }
    }
  }

  const filterd = await filterdetail(finalResult);
  if (filterd.length > 0) {
    console.log("test4->passed");
    return res
      .status(200)
      .json(new ApiResponse(200, finalResult, "data fetched "));
  } else {
    console.log("test4->failed");
    return message(req, res, 500, "technicale error occured");
  }
});
exports.getDoctorDetails = asyncHandler(async (req, res) => {
  //1.find the patinet
  //2.find the doctor
  //3.santize the data
  const getting_doctor_data = await get_Doctor_Details_logic(pat_id.doc_id);
  if (getting_doctor_data) {
    const filter = filterdetail(find_doctor);
    if (filter) {
      console.log("test3->passed");
      return (
        res.status(200), json(new ApiResponse(200, filter, "details fetched"))
      );
    } else {
      console.log("test3->failed");
      return res.status(500).json({ error: "could not filter the data" });
    }
  } else {
    throw new ApiError(500, "function failed");
  }
});
exports.fetchSidebarContent = asyncHandler(async (req, res) => {
  
  const fetching_data = await data_logic(req.user?.id);
  if (fetching_data) {
    console.log(req.query.redisKey);
    setCahe(req.query.redisKey, fetching_data, req.user.id);
    return res
      .status(200)
      .json(new ApiResponse(200, fetching_data, "data has been fteched"));
  } else {
    throw new ApiError(404, "could not fetch the data");
  }
});
exports.find_the_nearest = asyncHandler(async (req, res) => {
  const finding_the_nearest = await find_the_nearest_doc_logic(req);
  if (finding_the_nearest) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, finding_the_nearest, "doctors in your proximity ")
      );
  } else {
    throw new ApiError(500, "function failed to fetch the nearest doctor");
  }
});
