const { default: mongoose } = require("mongoose");
const { filterdetail } = require("../../Constants");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const Messages = require("../Models/Message.Model");
const ApiError = require("../Utils/Apierror.Utils");

exports.createDoctor = async (doctorDate, uploadimage) => {
  const { name, email, password, phone, address, role, gender } = doctorDate;
  const user = await Doctor.create({
    name,
    email,
    password,
    phone,
    profileImage: uploadimage,
    address,
    role,
    gender,
  });

  const hashData = await user?.hashPassword(user.password);
  if (!hashData && !user) {
    return false;
  } else {
    return user;
  }
};

exports.createPatient = async (patientData, uploadimage) => {
  const { name, email, password, phone, address, role, gender } = patientData;

  const user = await User.create({
    name: name,
    email: email,
    password: password,
    phone: phone,
    profileImage: uploadimage,
    address: address,
    role: role,
    gender: gender,
  });
  const hashData = await user?.hashPassword(user.password);
  if (!hashData && !user) {
    return false;
  } else {
    return user;
  }
};

exports.findDoctor = async (doctorData) => {
  const doctor = await Doctor.findOne({ email: doctorData });

  if (!doctor) {
    return false;
  } else {
    return doctor;
  }
};

exports.findPatient = async (userData) => {
  const patient = await User.findOne({ email: userData });
  if (!patient) {
    return false;
  } else {
    return patient;
  }
};

exports.findDoctorId = async (Id) => {
  const doctor = await Doctor.findById(Id);
  if (!doctor) {
    return false;
  } else {
    return doctor;
  }
};

exports.findPatientId = async (Id) => {
  if (typeof Id !== "string") {
    const id_to_String = String(Id);
    const patient = await User.findById(id_to_String);
    if (!patient) {
      return false;
    } else {
      return patient;
    }
  } else {
    const patient = await User.findById(Id);
    if (!patient) {
      return false;
    } else {
      return patient;
    }
  }
};

exports.saveData = async (datatosave, valutoassign) => {
  if (datatosave instanceof mongoose.Document) {
    const data = (datatosave = valutoassign);
    const save = await data.save();
    if (save) {
      return true;
    } else {
      return false;
    }
  }
};

exports.find_one_And_Update_doc_avail = async (id, currentDay) => {
  const update = await Doctor.findOneAndUpdate(
    { _id: id },
    { $inc: { "availability.$[elem].laterNumber.number": 1 } },
    { arrayFilters: [{ "elem.day": currentDay }], new: true }
  );
  if (update) {
    return update;
  }
};

exports.find_By_Id_and_update_patient_status = async (
  id,
  patientNumber,
  Time,
  currentDay,
  date
) => {
  const update = await User.findByIdAndUpdate(
    id,
    {
      $push: {
        appointmentStatus: {
          appointment: true,
          patient: {
            patientnumber: patientNumber,
            time: Time,
            day: currentDay,
            date: date?.date,
          },
        },
      },
    },
    { new: true }
  );
  if (update) {
    return update;
  }
};

exports.fetch_Doc_By_Role = async () => {
  const doctors = await Doctor.find({ role: "doctor" });
  if (doctors) {
    return doctors;
  }
};

exports.data_fetch = async () => {
  const data_fetch = await Doctor.aggregate([
    {
      $group: {
        _id: null,
        specialization: {
          $push: "$specialization",
        },
        address: {
          $push: "$address",
        },
        doctors: {
          $push: "$name",
        },
      },
    },
    {
      $project: {
        _id: 0,
        address: 1,
        doctors: 1,
        specializations: {
          $reduce: {
            input: "$specialization",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        address: 1,
        doctors: 1,
        specializedIn: { $setUnion: ["$specializations"] },
      },
    },
    {
      $addFields: {
        totalDoctors: { $size: "$doctors" },
      },
    },
  ]);

  if (data_fetch) {
    return data_fetch;
  } else {
    return false;
  }
};

exports.empty_user_patientStatus = async (id) => {
  const remove_User_Documente = await User.findByIdAndUpdate(
    id,
    {
      $set: { appointmentStatus: [] },
    },
    { new: true }
  );
  if (remove_User_Documente) {
    return remove_User_Documente;
  } else {
    return false;
  }
};

exports.decrement_patient_number = async (id, day) => {
  const decrement_Doctor_number = await Doctor.updateOne(
    { _id: id },
    {
      $inc: {
        "availability.$[elem].laterNumber.number": -1,
      },
    },
    {
      arrayFilters: [{ "elem.day": day }],
      new: true,
    }
  );
  if (decrement_Doctor_number) {
    return decrement_Doctor_number;
  } else {
    return false;
  }
};

exports.save_coordinates_pat = async (id, longitude, latitude) => {
  const coordinates = await User.findOneAndUpdate(
    { _id: id },
    {
      coordinates: [longitude, latitude],
    },
    {
      new: true,
    }
  );
  if (coordinates) {
    return true;
  } else {
    return false;
  }
};

exports.save_coordinates_doc = async (id, longitude, latitude) => {
  const coordinates = await patient.findOneAndUpdate(
    { _id: id },
    {
      coordinates: [longitude, latitude],
    },
    {
      new: true,
    }
  );
  if (coordinates) {
    return true;
  } else {
    return false;
  }
};

exports.weekly_appointment = async (id) => {
  const data_fetch = await Doctor.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $unwind: "$availability",
    },
    {
      $group: {
        _id: null,
        WeeklyAppointment: {
          $push: "$availability",
        },
      },
    },
  ]);
  if (data_fetch) {
    return data_fetch;
  }
};

exports.saveMessage_sender = async (patientId, doctorId, message, role) => {
  const saveMessage = await Messages.create({
    from: role === "doctor" ? doctorId : patientId,
    to: role === "doctor" ? doctorId : patientId,
    role: role,
    message: message,
  });
  if (saveMessage) {
    return saveMessage;
  } else {
    return true;
  }
};

exports.lookup_in_all_collections = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const user = await Doctor.findById(id);
    if (!user) {
      throw new ApiError(403, "user could not be find in any collections");
    } else {
      const sanitize_data = filterdetail(user);
      if (sanitize_data) {
        return sanitize_data;
      } else {
        throw new ApiError(500, "could not sanitize the data");
      }
    }
  } else {
    const sanitize_data = filterdetail(user);
    if (sanitize_data) {
      return sanitize_data;
    } else {
      throw new ApiError(500, "could not sanitize the data");
    }
  }
};
