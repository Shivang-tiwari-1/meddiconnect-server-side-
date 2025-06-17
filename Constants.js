const redis = require("redis");
const socketIO = require("socket.io");
const Redis = require("ioredis");
const mongoose = require("mongoose");
exports.DB_NAME = "DoctorManagment";

exports.CLOUDINARY_FOLDER = "Mediconnect";

let io;

exports.options = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};

exports.corsOptions = {
  origin: process.env.COROS_PORT,
  credentials: true,
};

exports.filterdetail = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    return data
      .filter((item) => {
        return item && Object.values(item).every((value) => value !== null);
      })
      .map((item) => {
        const obj = item instanceof mongoose.Document ? item.toObject() : data;
        const {
          password,
          numberOfPatients,
          createdAt,
          updatedAt,
          refreshToken,
          __v,
          ...userData
        } = obj;

        return userData;
      });
  } else {
    const obj = data instanceof mongoose.Document ? data.toObject() : data;
    const {
      password,
      numberOfPatients,
      createdAt,
      updatedAt,
      refreshToken,
      __v,
      ...userData
    } = obj;
    return userData;
  }
};

exports.convertToISOTime = function (time12h) {
  const [time, period] = time12h.split(" ");

  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  const isoString = date.toISOString().slice(0, -1);
  return isoString;
};

exports.setSocket = (server) => {
  console.log("setting->socket");
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });
};

exports.getSocketIo = () => {
  console.log("getting->socket");
  if (!io) {
    throw new Error("Socket.IO is not initialized.");
  }
  return io;
};

exports.client = redis.createClient({
  url: process.env.REDIS_PORT,
});

exports.pub = new Redis( process.env.REDIS_PORT);

exports.sub = new Redis( process.env.REDIS_PORT);

exports.redis = new Redis();

exports.socketCollection = new Map();
