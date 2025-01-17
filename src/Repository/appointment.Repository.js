const Appontment = require("../Models/Appointment.Models");

exports.create_appointment = async (doc_id, pat_id, currentDay, date, Time) => {
  const appointment = await Appontment.create({
    doctor: doc_id,
    patient: pat_id,
    laterPatient: {
      day: currentDay,
      date: date,
      Time: Time,
    },
  });
  if (appointment) {
    return appointment;
  }
};

exports.create_appointment_later = async (
  doc_id,
  pat_id,
  currentDay,
  date,
  appointment_at,
  Time
) => {
  const appointment = await Appontment.create({
    doctor: doc_id,
    patient: pat_id,
    laterPatient: {
      day: currentDay,
      date: date,
      AppointmentAt: appointment_at,
      Time: Time,
    },
  });
  if (appointment) {
    return appointment;
  }
};

exports.find_appointment = async (doc_id, pat_id, day, date, time) => {
  const find_appointment = await Appontment.find({
    doctor: doc_id,
    patient: pat_id,
    laterPatient: {
      $elemMatch: {
        day: day,
        date: date,
        Time: time,
      },
    },
  });
  if (find_appointment) {
    return find_appointment;
  }
};

exports.find_appointment_by_id = async (id) => {
  const appointment = await Appontment.findById(id);
  if (appointment) {
    return appointment;
  } else {
    return false;
  }
};
exports.delete_by_id = async (id) => {
  const delete_The_Appointment = await Appontment.findByIdAndDelete(id);
  if (delete_The_Appointment) {
    return delete_The_Appointment;
  } else {
    return false;
  }
};
