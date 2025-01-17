const Notification = require("../Models/Notification.Model");

exports.getNotificationOdthePatient = async (id) => {
  const patientNotification = await Notification.find({
    "reciver.type": id,
  });
  if (patientNotification) {
    return patientNotification;
  } else {
    return false;
  }
};

exports.getNotificationOdtheDoctor = async (id) => {
  const doctorNotification = await Notification.find({
    "reciver.type": id,
  });
  if (doctorNotification) {
    return doctorNotification;
  } else {
    return false;
  }
};

exports.createntificationforUser = async (id, role, message) => {
  if ((id, typeof role === "string" && typeof message === "string")) {
    const setNotfication = await Notification.create({
      reciver: { type: id, role: role },
      message: message,
    });
    if (setNotfication) {
      return true;
    } else {
      return false;
    }
  }
};

exports.delete_Notification = async (id) => {
  if ((id, typeof id === "string")) {
    const delete_Noti = await Notification.find({
      _id: id,
      "reciver.type": id,
    });
    if (delete_Noti) {
      return true;
    } else {
      return false;
    }
  }
};

exports.insert_many = async (notification) => {
  const insert = await Notification.insertMany(notification);
  if (insert) {
    return true;
  }
};
