const moment = require("moment");

exports.createTime = (time) => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
};

exports.currentTime = () => {
  const now = new Date();
  // const currentTime = now.toLocaleTimeString("en-GB", { hour12: false });
  const currentTime = now.toISOString();
  return currentTime;
};

exports.createCurrentDay = () => {
  const now = new Date();
  const currentDay = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase()
    .toString();
  return currentDay;
};

exports.cerateCurrentDate = () => {
  const currentDate = moment();
  return currentDate.format("YYYY-MM-DD");
};

exports.open_cage_geocoder = async () => {};

exports.serializeData = async (data) => {
  return data.map((index) => ({
    ...index,
    _id: index._id instanceof ObjectId ? index._id.toString() : index._id,
    qualification:
      qualification.length > 0
        ? qualification.map((item) => JSON.stringify(item))
        : qualification,
    specialization:
      specialization.length > 0
        ? specialization.map((item) => JSON.stringify(item))
        : specialization,
    availability:
      availability.length > 0
        ? aavailability.map((item) => JSON.stringify(item))
        : availability,
  }));
};
