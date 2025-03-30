const mongoose = require("mongoose");
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/Auth.Utils");

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    gender: { type: String, required: true },
    profileImage: { type: String, required: true },
    address: { type: String, required: true },
    history: [
      {
        patientId: {
          type: mongoose.Types.ObjectId,

          ref: "User",
        },
        prescription: { type: Buffer },
        date: { type: String },
      },
    ],
    qualification: [
      {
        MedicalRegistrationCertificate: { type: String },
        MBBSDegree: { type: String },
        StateMedicalCouncilRegistration: { type: String },
      },
      {
        _id: false,
      },
    ],

    location: {
      type: String,
      enum: ["point"],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    specialization: [{ field: { type: String, required: true }, _id: false }],
    Max: { type: Number },
    patientStatus: [
      {
        number: { type: Number, default: 0 },
      },
      {
        _id: false,
      },
    ],
    role: { type: String, required: true },
    availability: [
      {
        day: { type: String },
        start: { type: String },
        end: { type: String },
        date: { type: String },
        laterNumber: { number: { type: Number, default: 0 } },
        available: { type: Boolean, default: false },
      },
      {
        _id: false,
      },
    ],
    Working_At: {
      type: String,
      enum: ["Hospital", "Clinic", "Private Practice", "Other"],
      required: true,
    },
    refreshToken: { type: String },
    isActive: { type: Boolean, default: false },
    charges: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DoctorSchema.pre("save", function (next) {
  this.availability.forEach((status) => {
    if (status.laterNumber.number < 0) {
      status.laterNumber.number = 0;
    }
  });
  next();
});

DoctorSchema.pre("findOneAndUpdate", function (next) {
  const filter = this.getFilter();
  const update = this.getUpdate();
  const options = this.getOptions();
  console.log(update);
  if (update.$set && update.$set.availability) {
    update.$set.availability.forEach((status) => {
      if (status.laterNumber.number < 0) {
        status.laterNumber.number = 0;
      }
    });
  }
  if (update.$inc && update.$inc["availability.$[].laterNumber.number"] < 0) {
    update.$inc["availability.$[].laterNumber.number"] = 0;
  }
  next();
});

DoctorSchema.methods.hashPassword = function (password) {
  return hashPassword.call(this, password);
};

DoctorSchema.methods.comparePassword = function (password) {
  return comparePassword.call(this, password);
};

DoctorSchema.methods.generateAccessToken = function () {
  return generateAccessToken.call(this);
};

DoctorSchema.methods.generateRefreshToken = function () {
  return generateRefreshToken.call(this);
};
const Doctor = mongoose.model("Doctor", DoctorSchema);
module.exports = Doctor;
