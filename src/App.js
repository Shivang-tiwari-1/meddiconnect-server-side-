const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { corsOptions } = require("../Constants");
const PatientRoute = require("./Routes/Patient.Routes");
const DoctorRoute = require("./Routes/Doctor.Routes");
const ReviewRoute = require("./Routes/Review.Routes");
const NotificationRoute = require("./Routes/Notification.Routes");
const Authentication = require("./Routes/Authenticate.Routes");
const message = require("./Routes/Message.Route");
const logger = require("./Utils/Logger");
const morgan = require("morgan");
const app = express();

const morganFormat = `:method :url :status :response-time ms`;

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        console.log(message);
        const parts = message.trim().split(" ");
        const logObject = {
          method: parts[0],
          url: parts[1],
          status: parts[2],
          responseTime: parts[3] + " " + parts[4],
          timestamp: new Date().toISOString(),
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);
app.use(express.json({ limit: "32mb" }));
app.use(express.urlencoded({ extended: true, limit: "32mb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/home", (req, res) => {
  res.json({ message: "hello" });
});

app.use("/api/patient", PatientRoute);
app.use("/api/doctor", DoctorRoute);
app.use("/api/review", ReviewRoute);
app.use("/api/Notification", NotificationRoute);
app.use("/api/authenticate", Authentication);
app.use("/api/message", message);
module.exports = app;
