const { filterdetail } = require("../../Constants");
const {
  setuser_is_active_data,
  set_patient_active,
} = require("../Middleware/Caching.Middleware");
const {
  createDoctor,
  createPatient,
  findDoctor,
  findPatient,
  save_coordinates_pat,
  save_coordinates_doc,
} = require("../Repository/userRepository");
const ApiError = require("../Utils/Apierror.Utils");
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
    name &&
    email &&
    password &&
    phone &&
    address &&
    role &&
    gender &&
    longitude &&
    latitude
  ) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    throw new ApiError(403, "data is missing");
  }

  const uploadimage = await upload_Single_image(file.path);
  if (uploadimage) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    throw new ApiError(404, "could not upload the image ");
  }

  if (role === "patient") {
    const user = await createPatient(userData, uploadimage);
    if (user) {
      console.log("test3->passed");
      const saving_coordinates = await save_coordinates_pat(
        user?._id.toString(),
        longitude,
        latitude
      );
      if (saving_coordinates) {
        console.log("test4->passed");
        const synatizedata = filterdetail(user);
        if (synatizedata && typeof synatizedata === "object") {
          console.log("test5->passed");
          return synatizedata;
        } else {
          console.log("test5->failed");
          throw new ApiError(500, "function failed to hide the sensitive data");
        }
      } else {
        console.log("test4->failed");
        throw new ApiError(500, "function failed to save the coordinates");
      }
    } else {
      console.log("test3->failed");
      throw new ApiError(500, "function failed to create the patient");
    }
  } else {
    const user = await createDoctor(userData, uploadimage);
    if (user) {
      console.log("test3->passed");
      const saving_coordinates = await save_coordinates_doc(
        user?._id.toString(),
        longitude,
        latitude
      );
      if (saving_coordinates) {
        console.log("test4->passed");
        const synatizedata = filterdetail(user);
        if (synatizedata && typeof synatizedata === "object") {
          console.log("test5->passed");
          return synatizedata;
        } else {
          console.log("test5->failed");
          throw new ApiError(500, "function failed to hide the sensitive data");
        }
      } else {
        console.log("test4->failed");
        throw new ApiError(500, "function failed to save the coordinates");
      }
    } else {
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
        // const setid = await set_patient_active(
        //   patient?._id.toString(),
        //   patient?.role
        // );
        // if (setid === null || setid === undefined) {
        //   console.log("test4->passed");

        // } else {
        //   console.log("test4->failed");
        //   throw new ApiError(500, "function failed to cache the data ");
        // }
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

        // const setid = await setuser_is_active_data(
        //   doctor?._id.toString(),
        //   doctor?.role
        // );
        // if (setid === null || setid === undefined) {
        //   console.log("test4->passed");
        //   return synatizedata;
        // } else {
        //   console.log("test4->failed");
        //   throw new ApiError(500, "function failed to cache the data ");
        // }
        return synatizedata;
      }
    } else {
      return false;
    }
  }
};
