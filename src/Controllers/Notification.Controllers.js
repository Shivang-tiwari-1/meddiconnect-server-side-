const Notification = require("../Models/Notification.Model");
const User = require("../Models/User.Model");
const {
  getNotificationOdthePatient,
  getNotificationOdtheDoctor,
  delete_Notification,
} = require("../Repository/NotificationRepository");
const { findPatientId, findDoctorId } = require("../Repository/userRepository");
const { getNotificationService } = require("../Services/notificationServices");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { validation } = require("../Utils/VerfiyAuthority");

exports.GetNotification = asyncHandler(async (req, res) => {
  let user_data;
  if (req.user) {
    user_data = await findPatientId(req.user?.id);
    if (user_data) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      return res.status(403).json({ error: "could not be found" });
    }
  } else {
    user_data = await findDoctorId(req.doctor?.id);
    if (user_data) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      return res.status(403).json({ error: "could not be found" });
    }
  }

  let notificationdata;
  if (user_data.role === "patient") {
    notificationdata = await getNotificationOdthePatient(req.user?.id);
    if (notificationdata) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
      return res
        .status(403)
        .json({ error: "could not find the notifications" });
    }
  } else {
    notificationdata = await getNotificationOdtheDoctor(req?.doctor?.id);
    if (notificationdata) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
      return res
        .status(403)
        .json({ error: "could not find the notifications" });
    }
  }
  if (notificationdata) {
    const gatherNotification = getNotificationService(notificationdata);
    if (gatherNotification) {
      console.log("test3->passed");
      return res
        .status(200)
        .json(
          new ApiResponse(200, gatherNotification, "notifications fetched")
        );
    } else {
      console.log("test3->failed");
      return res
        .status(403)
        .json({ error: "could not find the notifications" });
    }
  }
});

exports.deleteAllNotification = asyncHandler(async (req, res) => {
  if (req.user) {
    let user = await findPatientId(req?.user?.id);
    if (user) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      throw new ApiError(403, "could not find the user");
    }

    const find_Notifi_del = await delete_Notification(user?._id?.toString());
    if (find_Notifi_del) {
      console.log("test2->passed");
      return res
        .statis(200)
        .json(new ApiResponse(200, null, "notification deleted"));
    } else {
      console.log("test2->passed");
      throw new ApiError(403, "could not delete the notification");
    }
  } else if (req.doctor) {
    let user = await findDoctorId(req?.user?.id);
    if (user) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      throw new ApiError(403, "could not find the user");
    }

    const find_Notifi_del = await delete_Notification(user?._id?.toString());
    if (find_Notifi_del) {
      console.log("test2->passed");
      return res
        .statis(200)
        .json(new ApiResponse(200, null, "notification deleted"));
    } else {
      console.log("test2->passed");
      throw new ApiError(403, "could not delete the notification");
    }
  }
});
