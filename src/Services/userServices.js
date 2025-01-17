const { filterdetail } = require("../../Constants");
const {
  createDoctor,
  createPatient,
  findDoctor,
  findPatient,
  save_coordinates_pat,
  save_coordinates_doc,
} = require("../Repository/userRepository");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { upload_Single_image } = require("../Utils/Cloudinary.Utils");

exports.create_user_logic = async (userData, file) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    role,
    gender,
    longitude,
    latitude,
  } = userData;
  if (
    !(
      name &&
      email &&
      password &&
      phone &&
      address &&
      role &&
      gender &&
      longitude &&
      latitude
    )
  ) {
    return false;
  }

  const uploadimage = await upload_Single_image(file.path);
  if (!uploadimage) {
    return false;
  }

  if (role === "patient") {
    const user = await createPatient(userData, uploadimage);
    if (!user) {
      return false;
    } else {
      const saving_coordinates = await save_coordinates_pat(
        user?._id.toString(),
        longitude,
        latitude
      );
      if (saving_coordinates) {
        const synatizedata = filterdetail(user);
        return synatizedata;
      } else {
        return false;
      }
    }
  } else {
    const user = await createDoctor(userData, uploadimage);
    if (!user) {
      return false;
    } else {
      const saving_coordinates = await save_coordinates_doc(
        user?._id.toString(),
        longitude,
        latitude
      );
      if (saving_coordinates) {
        const synatizedata = filterdetail(user);
        return synatizedata;
      } else {
        return false;
      }
    }
  }
};

exports.login_User_logic = async (userData) => {
  const { email, password, role } = userData;
  if (!(email, password, role)) {
    return false;
  }

  if (role === "patient") {
    const patient = await findPatient(email);
    if (patient) {
      patient.isActive = true;
      patient.save();
      const passwordCompare = await patient?.comparePassword(password);
      if (patient && passwordCompare) {
        const synatizedata = filterdetail(patient);
        return synatizedata;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    const doctor = await findDoctor(email);
    if (doctor) {
      doctor.isActive = true;
      doctor.save();
      const passwordCompare = await doctor?.comparePassword(password);
      if (passwordCompare) {
        const synatizedata = filterdetail(doctor);
        return synatizedata;
      }
    } else {
      return false;
    }
  }
};
