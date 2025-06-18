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
    //there was no need to make it an array
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
      type: {
        type: String,
        enum: [ 'Point' ],
        default: 'Point'
      },
      coordinates: {
        type: [ Number ],
      }
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
    City: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      enum: [
        "Afghanistan",
        "Albania",
        "Algeria",
        "Andorra",
        "Angola",
        "Antigua and Barbuda",
        "Argentina",
        "Armenia",
        "Australia",
        "Austria",
        "Azerbaijan",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belgium",
        "Belize",
        "Benin",
        "Bhutan",
        "Bolivia",
        "Bosnia and Herzegovina",
        "Botswana",
        "Brazil",
        "Brunei",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cabo Verde",
        "Cambodia",
        "Cameroon",
        "Canada",
        "Central African Republic",
        "Chad",
        "Chile",
        "China",
        "Colombia",
        "Comoros",
        "Congo (Brazzaville)",
        "Congo (Kinshasa)",
        "Costa Rica",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Djibouti",
        "Dominica",
        "Dominican Republic",
        "East Timor",
        "Ecuador",
        "Egypt",
        "El Salvador",
        "Equatorial Guinea",
        "Eritrea",
        "Estonia",
        "Eswatini",
        "Ethiopia",
        "Fiji",
        "Finland",
        "France",
        "Gabon",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Greece",
        "Grenada",
        "Guatemala",
        "Guinea",
        "Guinea-Bissau",
        "Guyana",
        "Haiti",
        "Honduras",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Ivory Coast",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakhstan",
        "Kenya",
        "Kiribati",
        "Kuwait",
        "Kyrgyzstan",
        "Laos",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libya",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Mali",
        "Malta",
        "Marshall Islands",
        "Mauritania",
        "Mauritius",
        "Mexico",
        "Micronesia",
        "Moldova",
        "Monaco",
        "Mongolia",
        "Montenegro",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Nepal",
        "Netherlands",
        "New Zealand",
        "Nicaragua",
        "Niger",
        "Nigeria",
        "North Korea",
        "North Macedonia",
        "Norway",
        "Oman",
        "Pakistan",
        "Palau",
        "Panama",
        "Papua New Guinea",
        "Paraguay",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Romania",
        "Russia",
        "Rwanda",
        "Saint Kitts and Nevis",
        "Saint Lucia",
        "Saint Vincent and the Grenadines",
        "Samoa",
        "San Marino",
        "Sao Tome and Principe",
        "Saudi Arabia",
        "Senegal",
        "Serbia",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Korea",
        "South Sudan",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Suriname",
        "Sweden",
        "Switzerland",
        "Syria",
        "Taiwan",
        "Tajikistan",
        "Tanzania",
        "Thailand",
        "Togo",
        "Tonga",
        "Trinidad and Tobago",
        "Tunisia",
        "Turkey",
        "Turkmenistan",
        "Tuvalu",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "Uruguay",
        "Uzbekistan",
        "Vanuatu",
        "Vatican City",
        "Venezuela",
        "Vietnam",
        "Yemen",
        "Zambia",
        "Zimbabwe",
      ],
      required: true,
    },
    postcode: {
      type: Number,
    },
    state: {
      type: String,
      enum: [
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chhattisgarh",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
      ],
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
DoctorSchema.index({ coordinates: '2dsphere' });

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
