const {
  create_appointment,
  find_appointment,
  find_appointment_by_id,
  create_appointment_later,
} = require("../Repository/appointment.Repository");
const { insert_many } = require("../Repository/NotificationRepository");
const {
  find_one_And_Update_doc_avail,
  find_By_Id_and_update_patient_status,
  findPatientId,
  fetch_Doc_By_Role,
  data_fetch,
  findDoctorId,
  empty_user_patientStatus,
  decrement_patient_number,
  lookup_in_all_collections,
  doctors_in_proximity,
} = require("../Repository/userRepository");
const {
  createCurrentDay,
  cerateCurrentDate,
} = require("../Repository/other.Repository");
const { Day_time_managment } = require("../Utils/Utility.Utils.");
const { verifyAuthority } = require("../Utils/VerfiyAuthority");
const {
  filterdetail,
  socketCollection,
  getSocketIo,
  convertToISOTime,
} = require("../../Constants");
const { emit_Notification } = require("./socket.service");
const { default: mongoose } = require("mongoose");
const ApiError = require("../Utils/Apierror.Utils");

exports.get_User_data_logic = async (id) => {
  const user = await findPatientId(id);
  if (user) {
    console.log("test-1-passed");
    return user;
  } else {
    console.log("test2-failed");
    return false;
  }
};
exports.fetch_All_Doctor_logic = async (page) => {
  const doctors = await fetch_Doc_By_Role(page);
  if (doctors) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(403).json({ error: "date was not transfered" });
  }
  const filteredDoctors = await filterdetail(doctors);
  if (filteredDoctors) {
    console.log("test2->passed");
    return filteredDoctors;
  } else {
    console.log("test2->failed");
    return false;
  }
};
exports.book_appointment_logic = async (req) => {


  let appointment_Exists = [];

  const find_Patient = await findPatientId(req?.user?.id);
  if (find_Patient) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return false;
  }

  const currentDay = createCurrentDay();
  if (currentDay && typeof currentDay === "string") {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return false;
  }

  const date = Day_time_managment(currentDay, null);
  if (date && typeof date === "object") {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return false;
  }

  const authority_check = await verifyAuthority(req, null, currentDay);
  if (authority_check.success && typeof authority_check === "object") {
    console.log("test4->passed");
  } else {
    console.log("test4->failed", authority_check.message);
    return false;
  }

  for (let i = 0; i < find_Patient?.appointmentStatus?.length; i++) {
    let patientStatus = find_Patient?.appointmentStatus[i]?.patient?.find(
      (status) => {
        return status.day === currentDay;
      }
    );
    if (patientStatus) {
      appointment_Exists.push(patientStatus);
    }
  }

  if (appointment_Exists.length > 0) {
    console.log("test5-failed");
    return false;
  } else {
    console.log("test5-passed");
  }

  const Time = date?.targetDateTime.slice(15);
  if (typeof Time === "string") {
    console.log("test6->passed");
  } else {
    console.log("test6->failed");
    return false;
  }

  const update_doctor_availability_laterpatient =
    await find_one_And_Update_doc_avail(
      authority_check?.findDoctor?._id,
      currentDay
    );
  if (update_doctor_availability_laterpatient) {
    console.log("test7->passed");
  } else {
    console.log("test7->failed");
    return false;
  }

  const getcurrentDayNumebr =
    update_doctor_availability_laterpatient?.availability.find((index) => {
      return index?.day === currentDay;
    });
  if (getcurrentDayNumebr !== undefined) {
    console.log("test8->passed");
  } else {
    console.log("test8->failed");
    return false;
  }

  const update_Patient_status = await find_By_Id_and_update_patient_status(
    find_Patient?._id,
    getcurrentDayNumebr?.laterNumber?.number,
    Time,
    currentDay,
    date?.date
  );
  if (update_Patient_status) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return false;
  }

  const appointment = await create_appointment(
    authority_check?.findDoctor?._id,
    find_Patient._id,
    currentDay,
    date?.date,
    Time
  );
  if (appointment) {
    console.log("test10->passed");
  } else {
    console.log("test10->failed");
    return false;
  }

  const emit_Notification_to_pat = emit_Notification(
    find_Patient?._id?.toString(),
    `your appointment with Dr ${authority_check?.findDoctor?.name}`,
    socketCollection
  );
  const emit_Notification_to_doc = emit_Notification(
    authority_check?.findDoctor?._id?.toString(),
    `you have a patient dr ${authority_check?.findDoctor?.name}`,
    socketCollection
  );
  if (emit_Notification_to_doc && emit_Notification_to_pat) {
    console.log("test10->passed");
  } else {
    throw new ApiError(500, "could not broadcast the message");
  }

  const notification = [
    {
      reciver: {
        type: authority_check?.findDoctor?._id,
        role: authority_check?.findDoctor?.role,
      },
      message: `you have a patient dr:${authority_check?.findDoctor?.name}`,
    },
    {
      reciver: {
        type: find_Patient?._id,
        role: find_Patient?.role,
      },
      message: `your Booked an appointment on ${date?.date} with dr:${authority_check?.findDoctor?.name}`,
    },
  ];
  const send_Notifi_to_doc_pati = await insert_many(notification);
  if (send_Notifi_to_doc_pati) {
    console.log("test11->passed");
    return true;
  } else {
    console.log("test11->failed");
    return false;
  }
};
exports.boo_Appointment_Manually_logic = async (day, time, req) => {
  const date = Day_time_managment(day, null);
  if (date && typeof date === "object") {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return false;
  }

  const Isos_time = convertToISOTime(time).slice(11, -4);
  if (convertToISOTime) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return false;
  }

  const createday = cerateCurrentDate();
  if (createday && typeof createday === "string") {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return false;
  }

  const find_patient = await findPatientId(req.user?.id);
  if (find_patient) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return false;
  }

  const authority_check = await verifyAuthority(req, null, day);
  if (authority_check && typeof authority_check === "object") {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return false;
  }

  const update_doctor_availability_laterpatient =
    await await find_one_And_Update_doc_avail(
      authority_check?.findDoctor?._id,
      day
    );
  if (update_doctor_availability_laterpatient) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return false;
  }

  const exis_Appoint_with_same_date_time = await find_appointment(
    authority_check?.findDoctor?.id,
    find_patient?.id,
    day,
    createday,
    Isos_time
  );
  if (exis_Appoint_with_same_date_time.length > 0) {
    console.log("test6->failed");
    return false;
  } else {
    console.log("test6->passed");
  }

  const time_check = find_patient?.appointmentStatus?.some((slot) => {
    return slot?.patient?.some((time) => {
      return time.time === Isos_time;
    });
  });
  if (time_check === undefined || time_check) {
    console.log("test7->failed");
    return false;
  } else {
    console.log("test7->passed");
  }

  const extract_number =
    update_doctor_availability_laterpatient?.availability?.find((slot) => {
      return slot?.day === day;
    });
  if (extract_number) {
    console.log("test8->passed", extract_number);
  } else {
    console.log("test8->failed");
    return false;
  }

  const update_Patient_status = await find_By_Id_and_update_patient_status(
    find_patient?._id,
    extract_number?.laterNumber?.number,
    Isos_time,
    extract_number?.day,
    extract_number?.date
  );
  if (update_Patient_status) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return false;
  }

  const create_appointment = await create_appointment_later(
    authority_check?.findDoctor?.id,
    find_patient?.id,
    day,
    createday,
    extract_number?.date,
    Isos_time
  );
  if (create_appointment) {
    console.log("test9->passed", create_appointment);
  } else {
    console.log("test9->failed");
    return false;
  }

  const notification = [
    {
      reciver: {
        type: authority_check?.findDoctor?._id,
        role: authority_check?.findDoctor?.role,
      },
      message: `you have a patient dr:${authority_check?.findDoctor?.name}`,
    },
    {
      reciver: {
        type: find_patient?._id,
        role: find_patient?.role,
      },
      message: `your Booked an appointment on ${date?.date} with dr:${authority_check?.findDoctor?.name}`,
    },
  ];

  const send_Notifi_to_doc_pati = await insert_many(notification);
  if (send_Notifi_to_doc_pati) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return false;
  }
  if (create_appointment && send_Notifi_to_doc_pati) {
    return {
      success: true,
      message: `appointment with dr${
        authority_check?.findDoctor?.name
      } has been made on ${
        (find_patient?.appointmentStatus?.patient?.day,
        find_patient?.appointmentStatus?.patient?.time)
      }`,
    };
  } else {
    return false;
  }
};
exports.cancle_Appointment_logic = async (doc_id, appo_id) => {
  const find_Patient = await findPatientId(pat_id);
  if (find_Patient) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return false;
  }

  const find_appointmentn = await find_appointment_by_id(appo_id);
  if (find_appointmentn) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return false;
  }

  const { day, date, AppointmentAt, Time } = await find_appointmentn
    ?.laterPatient[0];
  if ((day, date)) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return false;
  }

  const authority_check = await verifyAuthority(
    req,
    find_appointmentn?.doctor,
    null
  );
  if (authority_check) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return false;
  }

  const match_day_time_with_appoint = find_Patient?.appointmentStatus?.find(
    (slot) => {
      return slot.patient?.some((patient) => {
        return (
          patient.day === day && patient.date === date && patient.time === Time
        );
      });
    }
  );
  if (match_day_time_with_appoint) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return false;
  }

  const remove_User_Documente = await empty_user_patientStatus(
    find_Patient?._id
  );
  if (
    !remove_User_Documente &&
    remove_User_Documente?.length !== find_Patient?.availability?.length
  ) {
    find_Patient.appointmentStatus = remove_User_Documente;

    const Save = await find_Patient.save();
    if (!Save) {
      return res.status(500).json({ error: "could not save" });
    }
    console.log("test6->passed");
  } else {
    console.log("test6->failed");
    return false;
  }

  const decrement_Doctor_number = await decrement_patient_number(
    authority_check?.findDoctor?._id,
    day
  );
  if (decrement_Doctor_number.modifiedCount > 0) {
    console.log("test7->passed");
  } else {
    console.log("test7->failed");
    return false;
  }

  const delete_The_Appointment = await delete_The_Appointment(
    find_appointmentn?._id
  );
  if (delete_The_Appointment) {
    console.log("test8->all test passed");
    return false;
  } else {
    console.log("test8->failed");
    return true;
  }
};
exports.history_logic = async () => {};
exports.get_Doctor_Details_logic = async (pat_id, doc_id) => {
  const find_user = await findPatientId(pat_id);
  if (find_user) {
    console.log("test-1-passed");
  } else {
    console.log("test2-failed");
    return false;
  }

  const find_doctor = await findDoctorId(doc_id);
  if (find_doctor) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return false;
  }
};
exports.data_logic = async () => {
  const fetch_data = await data_fetch();
  if (fetch_data) {
    console.log("test2->passed");
    return fetch_data;
  } else {
    console.log("test2->failed");
    return false;
  }
};
exports.find_the_nearest_doc_logic = async (id) => {
  const { distance } = req.user;
  if (!distance) return false;
  if (typeof distance !== "number") Number(distance);

  const user = lookup_in_all_collections(req.user.id);
  if (user) {
    console.log("test1->passed");
  } else {
    console.log("test2->failed");
    return false;
  }

  const finding = await doctors_in_proximity(
    coordinates[0],
    coordinates[1],
    distance
  );
  if (finding) {
    console.log("test1->passed");
    return finding;
  } else {
    console.log("tets2->failed");
    return false;
  }
};
