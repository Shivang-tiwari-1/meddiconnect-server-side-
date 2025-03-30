const { default: mongoose } = require("mongoose");

const hospitalSchema = new mongoose.schema({}, { timestamps: true });
const HospitalSchema = mongoose.model("Doctor", hospitalSchema);
module.exports = HospitalSchema;
