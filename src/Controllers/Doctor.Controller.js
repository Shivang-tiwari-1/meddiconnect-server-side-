const {
  convertToISOTime,
  filterdetail,
  socketCollection,
} = require("../../Constants");
const Appontment = require("../Models/Appointment.Models");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { agenda } = require("../ScheduleTasks/agend.ScheduleTasks");
const { default: mongoose } = require("mongoose");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { Day_time_managment } = require("../Utils/Utility.Utils.");
const { message } = require("../Utils/VerfiyAuthority");
const { upload_multiple_file } = require("../Utils/Cloudinary.Utils");
const { emit_Notification } = require("../Services/socket.service");
const { data_logic, setCriteria_logic } = require("../Services/doctor.Service");
const ApiError = require("../Utils/Apierror.Utils");

//************************************functionalities**************************************//
//GetDoctordetais --- account detail
//SetDoctorAvailabilty --- sets the number of day the doctor will be available
//GetDetailsOfThePatient --- patient who have appointment to the Doctor can see there details
//prescribeMedicine --- after checkup doctor will be available to prescribe medicine
//specializesIn --- doctor can set what they specialize in
//fetchSidebarContent --- necessary data or information for the user like address name locality etc
//************************************functionalities**************************************//

exports.getDoctorData = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.doctor.id);
  if (doctor) {
    console.log("test-1-passed");
  } else {
    console.log("test1-failed");
    return message(req, res, 403, "could not find the doctor");
  }

  const filterdetails = filterdetail(doctor);
  if (!filterdetail) {
    return message(req, res, 500, "technical error occured");
  } else {
    return res
      .status(200)
      .json(new ApiResponse(200, filterdetails, "docotr fetched successfully"));
  }
});
exports.setCriteria = asyncHandler(async (req, res) => {
  //algo
  //1.retrieve data (Array format with objects in it length > 0 )
  //2.find the doctor
  //3.create a promise(
  //4. retrieve target_time and date from Day_time_management()
  //5.convert the end time to iso
  //6.convert the start time to iso
  //7. check if same entry already exists
  //8. create the entry in the database
  //9. schedule the jobs for each object in the array
  //)
  //10. if promise is complete send the response

  const { data } = req.body;
  if (Array.isArray(data) && data?.length > 0 && data) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return message(req, res, 401, "Data could not be fetched");
  }

  const setting = await setCriteria_logic(req, data);
  if (setting) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "criteria has been set"));
  } else {
    throw new ApiError(500, "function failed to create the doc");
  }
});
exports.getDetailOfthePatient = asyncHandler(async (req, res) => {
  const pipeline = await Doctor.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req?.doctor?.id) },
    },
    {
      $lookup: {
        from: "appointments",
        localField: "_id",
        foreignField: "doctor",
        as: "result",
      },
    },

    {
      $unwind: "$result",
    },
    {
      $replaceRoot: {
        newRoot: "$result",
      },
    },
  ]);
  if (pipeline?.length > 0) {
    console.log("test1->passed");
    let collected_patients = [];
    const collect_Patient_id = [];
    let snatizedata;

    pipeline.forEach((index) => {
      const patientId = index.patient.toString();
      if (
        Array.isArray(collect_Patient_id) &&
        !collect_Patient_id?.includes(patientId)
      ) {
        collect_Patient_id.push(patientId);
      }
    });
    if (collect_Patient_id.length > 0 && Array.isArray(pipeline)) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
      return message(req, res, 203, "patient id not found");
    }

    await Promise.all(
      collect_Patient_id.map(async (item) => {
        const find_patient = await User.findById(item);
        if (find_patient && find_patient instanceof mongoose.Document) {
          collected_patients.push(find_patient);
          const now = new Date();
          const date = now.toLocaleDateString();
          collected_patients.filter((index) => {
            return index.data === date;
          });
          if (
            !Array.isArray(collected_patients) &&
            collected_patients?.length === 0
          ) {
            return message(req, res, 500, "array is empty");
          }
        } else {
          return message(req, res, 400, "could not find the patient ");
        }
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, collected_patients, "data fetched"));
  } else {
    console.log("test1->failed");
    return message(req, res, 204, "you have no patients yet");
  }
});
exports.manualUpdate = asyncHandler(async (req, res) => {
  //1.look for rhe doctor
  //2.look for the patient
  //3.get the current day
  //4.using the pasiantid and doctorid and currendate look for the appointment
  //5.Delete the appointment
  //6.decrement the patient number fo the specific day
  //7.empty the appointment status for patient

  //1
  const find_doctor = await Doctor.findById(req.doctor?.id);
  if (find_doctor) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(req, res, 403, "could nto find the doctor");
  }
  //2
  const find_user = await User.findById(req, params.id);
  if (find_user) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 403, "could not find the patient");
  }
  //3
  const currentDay = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  if (currentDay) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return message(req, res, 500, "technical error occured");
  }
  //4
  const find_appointmentn = await Appontment.find({
    docotr: find_doctor?.id,
    patient: find_patient?.id,
    laterNumber: [
      {
        day: currentDay,
      },
    ],
  });
  if (find_appointmentn) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 404, "bad request");
  }
  //5
  const delete_The_Appointment = await Appontment.finndByIdAndDelete(
    find_appointmentn?.id
  );
  if (delete_The_Appointment) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    message(req, res, 404, "bad request");
  }
  //6
  const update_doctor = await Doctor.findByIdAndUpdate(
    find_doctor?._id,
    {
      "availability.$[elem].laterNumber.number": -1,
    },
    {
      arrayFilters: [{ "elem.day": currentDay }],
      new: true,
    }
  );
  if (update_doctor) {
    console.log("test6->passed");
  } else {
    console.log("test6-failed");
    return message(req, res, 404, "bad request");
  }
  //7
  const update_user = await User.findByIdAndUpdate(
    req.params?.id,
    {
      $set: {
        appointmentStatus: [],
      },
    },
    {
      arrayFilters: [{ "elem.appointment": true }],
    }
  );
  if (update_user) {
    console.log("test7->passed");
    res.status(200).json(new ApiResponse(200, null, "Manually updated"));
  } else {
    console.log("test7->failed");
    return message(req, res, 404, "bad request");
  }
});
exports.prescribeMedicine = asyncHandler(async (req, res) => {
  const { prescription } = req.file;
  if (Buffer.isBuffer(prescription)) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(
      req,
      res,
      500,
      "prescription is not binnary or not available "
    );
  }

  const find_doctor = await Doctor.findById(req.docotr.id);
  if (find_doctor) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 403, "could not find the doctro");
  }

  const find_patient = await User.findById(req?.params?.id);
  if (find_patient) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 403, "could not find the patient");
  }

  const now = new Date();
  if (now && now instanceof Date) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 500, "now os not a date object");
  }

  const currentDay = now
    .toLocaleDateString("en-Us", { weekday: "long" })
    .toLowerCase()
    .toString();
  if (currentDay && typeof currentDay === String) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return message(
      req,
      res,
      500,
      "currently is not a string or not there at all"
    );
  }

  const retrive_current_date_document = find_doctor?.availability?.find(
    (index) => {
      return index.day === currentDay;
    }
  );
  if (
    Array.isArray(retrive_current_date_document) &&
    retrive_current_date_document.length > 0 &&
    retrive_current_date_document
  ) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return message(req, res, 500, "array is empty");
  }

  const check_if_same_date_in_patient =
    find_patient.appointmentStatus.patient.some((index) => {
      return index.date === retrive_current_date_document[0]?.date;
    });
  if (check_if_same_date_in_patient) {
    console.log("test6->passed");
  } else {
    console.log("test6->failed");
    return message(
      req,
      res,
      500,
      "no date is there in patient appointment status"
    );
  }

  const saveprescription = await User.findByIdAndUpdate(
    find_user?._id,
    {
      $push: {
        prescriptions: {
          prescription: prescription,
          date: retrive_current_date_document[0].date,
        },
      },
    },
    {
      new: true,
    }
  );
  if (saveprescription) {
    console.log("test7->passed");
  } else {
    console.log("test8->failed");
    return message(req, res, 401, "could not update the prescription");
  }
});
exports.spealisesIn = asyncHandler(async (req, res) => {
  /*********************************************algo****************************************/
  // 1.retrieve the specialization from the body
  // 2.find the doctor
  // 3.check if same filed already exists or not
  // 4.convert the elements in the array to strings and check if they are string
  // 5.push the details in specialization
  /*********************************************algo****************************************/

  //1
  const { specialization } = req.body;
  if (specialization?.length > 0 && Array.isArray(specialization)) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(req, res, 403, "array is empty");
  }

  //2
  const find_doctor = await Doctor.findById(req.doctor.id);
  if (find_doctor) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 404, "could not find the doctor");
  }
  //3
  const check_if_already_exists = find_doctor.specialization.some((element) => {
    return specialization.includes(element.field);
  });
  if (!check_if_already_exists) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 406, " field already exists");
  }

  //4
  const check_if_string = req.body.specialization.map(String);
  if (Array.isArray(check_if_string)) {
    const All_are_string = check_if_string.every((index) => {
      return typeof index === "string";
    });
    if (All_are_string) {
      console.log("test2->passd");
    } else {
      console.log("test2->failed");
      return message(req, res, 406, "not a string");
    }
  }

  //5
  const update_specialization_array = await Doctor.findByIdAndUpdate(
    req.doctor.id,
    {
      $push: {
        specialization: {
          $each: specialization.map((specialization) => ({
            field: specialization,
          })),
        },
      },
    }
  );
  if (update_specialization_array) {
    console.log("test3->passed");
    return res.status(200).json(
      new ApiResponse(200, {
        data: update_specialization_array?.specialization,
      })
    );
  } else {
    console.log("test4->failed");
    return message(req, res, 400, "could not update");
  }
});
exports.patientHistory = asyncHandler(async (req, res) => {
  let patient_date = [];
  const find_doctor = await Doctor.findById(req.doctro.id);
  if (find_doctor) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(req, res, 403, "could not find the docotor");
  }

  const gather_history = [...find_doctor.history];
  if (Array.isArray(gather_history)) {
    console.log("test2->passed");
  } else if (gather_history?.length == 0) {
    return message(req, res, 500, "no appointment available");
  } else {
    console.log("test2->passed");
    return message(
      req,
      res,
      500,
      "could not create a shallow cop of the array"
    );
  }
  for (let i = 0; i <= gather_history?.length - 1; i++) {
    const patient = await User.findById(gather_history[0]._id);
    if (patient) {
      console.log("test3->passed");
      patient_date.push(patient);
    } else {
      console.log("test3->passed");
      return message(req, res, 403, "could not find the user");
    }
  }

  for (let i = 0; i <= patient_date.length; i++) {
    if (patient_date.length === 0) {
      patient_date.push(patient_date[i]);
    } else {
      for (let j = 0; j <= patient_date?.length - 1; j++) {
        if (patient_date[i].id !== patient_date[j].id) {
          patient_date.push(patient_date[i]);
        }
      }
    }
  }
  if (patient_date.length > 0) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return message(req, res, 500, "array is empety");
  }

  const snatizedata = await filterdetail(patient_date);
  if (snatizedata.length > 0) {
    console.log("test5->passed");
    return res
      .status(200)
      .json(new ApiResponse(200, patient_date, "data fetched "));
  } else {
    console.log("test4->failed");
    return message(req, res, 500, "technicale error occured");
  }
});
exports.quallification = asyncHandler(async (req, res) => {
  if (!req.files) {
    console.log("files");
    return message(req, res, 400, "No file uploaded");
  }
  const {
    MedicalRegistrationCertificate,
    MBBSDegree,
    StateMedicalCouncilRegistration,
  } = req.files;
  if (
    !MedicalRegistrationCertificate ||
    !MBBSDegree ||
    !StateMedicalCouncilRegistration
  ) {
    return message(req, res, 400, "all fields are required");
  }

  console.log("---->",
    MedicalRegistrationCertificate,
    MBBSDegree,
    StateMedicalCouncilRegistration
  );

  const store_information = [
    MedicalRegistrationCertificate,
    MBBSDegree,
    StateMedicalCouncilRegistration,
  ];
  if (Array.isArray(store_information) && store_information.length === 3) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 406, "qualification details are not in array");
  }

  const uploadfile = await upload_multiple_file(store_information);
  console.log(uploadfile);
  if (uploadfile) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return message(req, res, 400, "could not upload files");
  }

  const find_doctor = await Doctor.findById(req.doctor.id);
  if (find_doctor) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return message(req, res, 403, "could not find the doctor");
  }
  console.log(MedicalRegistrationCertificate);
  const check_if_qualification_exists = Doctor.find(req?.doctor?.id, {
    qualification: {
      MedicalRegistrationCertificate: uploadfile[0],
      MBBSDegree: uploadfile[1],
      StateMedicalCouncilRegistration: uploadfile[2],
    },
  });
  if (check_if_qualification_exists) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return message(req, res, 406, "qualification already exists");
  }

  const update_qualification = await Doctor.findByIdAndUpdate(
    req.doctor.id,
    {
      $set: {
        qualification: {
          MedicalRegistrationCertificate:
            MedicalRegistrationCertificate[0].path,
          MBBSDegree: MBBSDegree[0].path,
          StateMedicalCouncilRegistration:
            StateMedicalCouncilRegistration[0].path,
        },
      },
    },
    {
      new: true,
    }
  );
  if (update_qualification) {
    console.log("test6->passed");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          update_qualification?.qualification,
          "qualification updated"
        )
      );
  } else {
    console.log("test6->failed");
    return message(req, res, 400, "could not update the qualification");
  }
});
exports.weekly_appointemnt_data = asyncHandler(async (req, res) => {});
