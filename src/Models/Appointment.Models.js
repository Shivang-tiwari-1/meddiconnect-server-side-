const mongoose = require("mongoose");

const AppointmentSchema = mongoose.Schema(
  {
    doctor: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patient: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    laterPatient: [
      {
        day: {
          type: String,
          required: true,
        },
        date: {
          type: String,
          required: true,
        },
        AppointmentAt: {
          type: String,
        },
        Time: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Appontment = mongoose.model("appointment", AppointmentSchema);
module.exports = Appontment;
