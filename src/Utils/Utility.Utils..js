const moment = require("moment");

const set_day = (day) => {
  if (typeof day === "string") {
    switch (day.toLowerCase()) {
      case "sunday":
        return (day = 0);
      case "monday":
        return (day = 1);
      case "tuesday":
        return (day = 2);
      case "wednesday":
        return (day = 3);
      case "thursday":
        return (day = 4);
      case "friday":
        return (day = 5);
      case "saturday":
        return (day = 6);
      default:
        throw new Error("Invalid day string");
    }
  } else if (typeof day === "number") {
    switch (day) {
      case 0:
        return "sunday";
      case 1:
        return "monday";
      case 2:
        return "tuesday";
      case 3:
        return "wednesday";
      case 4:
        return "thursday";
      case 5:
        return "friday";
      case 6:
        return "saturday";
      default:
        throw new Error("Invalid day number");
    }
  } else {
    throw new Error("Day must be either a string or a number");
  }
};

const Day_time_managment = (day, end) => {
  const dayNumber = set_day(day);
  const now = moment().tz("Asia/Kolkata");
  let targetDateTime = now.clone().day(dayNumber);
  if (
    now.day() > dayNumber ||
    (now.day() === dayNumber && now.isAfter(targetDateTime))
  ) {
    targetDateTime.add(1, "week");
  }

  targetDateTime
    .hour(moment(end, "hh:mm A").hour())
    .minute(moment(end, "hh:mm A").minute())
    .second(0)
    .millisecond(0);
  return {
    targetDateTime: targetDateTime.toString(),
    date: targetDateTime.format("MM-DD-YYYY"),
  };
};


const updateAvailabilityDates = (days, times) => {
  const dayOfWeek = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  console.log("from fucntion->", days, times);
  return days.map((day, index) => {
    const dayNumber = dayOfWeek[day.toLowerCase()];
    if (dayNumber === undefined) {
      throw new Error(`Invalid day: ${day}`);
    }

    const now = moment().tz("Asia/Kolkata");

    let scheduledTargetTime = now.clone().day(dayNumber);

    scheduledTargetTime
      .hour(moment(times[index], "HH:mm:ss").hour())
      .minute(moment(times[index], "HH:mm:ss").minute())
      .second(0)
      .millisecond(0)
      .add(7, "days");

    return {
      raegetedTiem: scheduledTargetTime.toString(),
      date: scheduledTargetTime.format("MM-DD-YYYY"),
    };
  });
};

module.exports = {
  set_day,
  Day_time_managment,
  updateAvailabilityDates,
};
