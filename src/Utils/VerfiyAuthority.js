const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const moment = require("moment");
const { currentTime, createTime } = require("../Repository/other.Repository");

exports.verifyAuthority = async (req, docId, day) => {
  //***********************************algo****************************** */
  // 1.if docId  is null assign id to data(variable) retrived from parameters
  // 2.if day is not not null conver it to toLowerCase
  // 3.if it is doctor that is trying to access the return false
  // 4.else if it is req.params.id that means it is user that is using some functionality that involves the doctor.id
  //5.find the doctor
  //6.findbyid returns mongo object convert it to an array
  //7.retrive the document from doctor that has the same day
  //8 check the existemce of the day
  //9.also check the max patient
  //10.return doctro and current patient number
  //***********************************algo****************************** */

  console.log("|");
  console.log("verifying authority.....");
  let data;
  let Day;
  let existence_of_day;

  //1
  if (docId === null) {
    data = req.params.id;
  } else {
    //2
    data = docId;
  }

  //3
  if (day !== null) {
    Day = day.toLowerCase();
  }

  //4
  if (req.doctor) {
    return false;
  } else if (req.params.id) {
    //5
    const findDoctor = await Doctor.findById(data);
    if (findDoctor) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed exiting Verify authority");
      return false;
    }

    if (day !== null) {
      //6
      const array = Object.entries(findDoctor);
      if (array) {
        console.log("test2->passed");
      } else {
        console.log("test2->failed");
        return false;
      }

      //7
      existence_of_day = array[2][1]?.availability?.find((status) => {
        return status.day === Day;
      });
      if (!existence_of_day) {
        console.log("test3->failed");
        return false;
      } else {
        console.log("test3->passed");
      }
      //8
      const check_for_the_day = findDoctor?.availability?.find((slot) => {
        return slot.day === existence_of_day?.day;
      });
      if (check_for_the_day) {
        console.log("test4->passed");
      } else {
        console.log("test4->failed");
        return false;
      }

      //9
      const now = currentTime();
      const endTime = createTime(check_for_the_day?.end);
      const startTime = createTime(check_for_the_day?.start);
      if (
        moment(now).isBefore(moment(endTime)) &&
        moment(now).isAfter(startTime)
      ) {
        //10
        if (
          req.isBookingAppointment &&
          findDoctor?.Max <= existence_of_day?.laterNumber?.number
        ) {
          return false;
        }

        console.log("verifying ended.....");
        console.log("|");
        //10
        return {
          success:true,
          findDoctor: findDoctor,
          currentNumber: existence_of_day?.laterNumber?.number,
        };
      } else {
        console.log("here");
        return {
          success: false,
          message: "clinic is closed",
        };
      }
    }
  }
};

exports.validation = async (req) => {
  console.log("|");
  console.log("validation----started");
  let find_Doctor;
  let find_User;

  if (req.params?.id) {
    find_Doctor = await Doctor.findById(req.params.id);
    if (!find_Doctor) {
      find_User = await User.findById(req.params.id);
      if (!find_User) {
        return false;
      } else {
        return find_User;
      }
    } else {
      return find_Doctor;
    }
  } else if (req.user) {
    find_User = await User.findById(req.user?._id);
    if (!find_User) {
      return false;
    } else {
      return find_User;
    }
  } else if (req.doctor) {
    find_Doctor = await Doctor.findById(req.doctor?.id);
    if (!find_Doctor) {
      return false;
    } else {
      return find_Doctor;
    }
  }
  console.log("validation----ended");
  console.log("|");
};

exports.message = async (req, res, status, message) => {
  if ((res, status, message)) {
    return res.status(status).json(message);
  }
};
