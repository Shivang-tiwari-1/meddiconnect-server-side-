const { convertToISOTime } = require("../../Constants");
const { agenda } = require("../ScheduleTasks/agend.ScheduleTasks");
const { Day_time_managment } = require("../Utils/Utility.Utils.");
const { message } = require("../Utils/VerfiyAuthority");
const ApiError = require("../Utils/Apierror.Utils");
const {
  findDoctorId,
  update_doc_schedule,
} = require("../Repository/userRepository");

exports.setCriteria_logic = async (req, data) => {
  const find_doctor = await findDoctorId(req.doctor?.id);
  if (find_doctor) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 403, "could not find the doctor");
  }

  await Promise.all(
    data.map(async (item) => {
      //4
      const scheduledTime = Day_time_managment(item.day, item.end);
      if (
        scheduledTime &&
        typeof scheduledTime === "object" &&
        scheduledTime.targetDateTime &&
        typeof scheduledTime.targetDateTime === "string" &&
        scheduledTime.date &&
        typeof scheduledTime.date === "string"
      ) {
        console.log("test3->passed");
      } else {
        console.log("test3->failed");
        throw new ApiError(500, "error occurred with scheduledTime");
      }
      //5
      const startTimeISO = convertToISOTime(item.start)?.slice(11, -4);
      if (startTimeISO && typeof startTimeISO === "string") {
        console.log("test4->passed");
      } else {
        console.log("test4->failed");
        throw new ApiError(500, "something went wrong with startTimeISO");
      }
      //6
      const endTimeISO = convertToISOTime(item.end)?.slice(11, -4);
      if (endTimeISO && typeof endTimeISO === "string") {
        console.log("test5->passed");
      } else {
        console.log("test5->failed");
        throw new ApiError(500, "something went wrong with endTimeISO");
      }
      //7
      const isOverlapping = find_doctor?.availability?.some((status) => {
        return (
          status.day === item.day &&
          ((startTimeISO >= status.start && startTimeISO <= status.end) ||
            (endTimeISO >= status.start && endTimeISO <= status.end))
        );
      });
      if (isOverlapping) {
        console.log("test6->failed");
        throw new ApiError(500, "entry already exists");
      } else {
        console.log("test6->passed");
      }

      if (find_doctor?.availability?.length >= 7) {
        throw new ApiError(500, "reached limit");
      }
      //8
      const create_entry = await update_doc_schedule(
        find_doctor?.id,
        item.day,
        startTimeISO,
        endTimeISO,
        scheduledTime.date,
        item.HowManyPatients
      );
      if (create_entry) {
        console.log("test7->passed");
      } else {
        console.log("test7->failed");
        throw new ApiError(500, "could not create entry");
      }

      const matchingAvailability = create_entry.availability.find(
        (availability) => availability.day === item.day
      );
      //9
      const job = await agenda.schedule(
        scheduledTime.targetDateTime,
        "remove expired availability",
        {
          doctorId: find_doctor._id,
          objectId: matchingAvailability._id,
        }
      );
      if (job) {
        console.log("test8->passed");
        return true;
      } else {
        console.log("test8->failed");
        throw new ApiError(403, "could not create the jobs");
      }
    })
  );
  return true;
};
