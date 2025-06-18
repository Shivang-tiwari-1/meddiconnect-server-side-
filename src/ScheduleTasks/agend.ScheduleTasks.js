const { Agenda } = require("agenda");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const User = require("../Models/User.Model");
const { updateAvailabilityDates } = require("../Utils/Utility.Utils.");
const moment = require("moment");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const Appontment = require("../Models/Appointment.Models");
const { message } = require("../Utils/VerfiyAuthority");
const { default: mongoose } = require("mongoose");
const { findDoctorId } = require("../Repository/userRepository");

//************************************scheduled-ALGO***************************************/
// 1.retrieve the doc_id from job.attrs.data
// 2.find the doctor
// 3. now we have to collect the passed day in to an array in doctor.availability the passed date will be collected in an array the purpose it to take one date and match it against all the dates or if any dates is after the date that is being used to match do not store it in the array
// (
//collects the passed day in to an array[]
// Check if the availability date is before now
// Compare the availability date with others in the array
// If any other availability is after now, set isAfterAll to false
// )
// 4.normalize the passed day  stored in the array turn it toLowerCase
// 5.dates that are collected fromm the doctor?.availability we have to give them the day and date of the coming day and date store it in an array
// 6. updating the particular day with the next date of the week for the same day for doctor in db  using the passed day and reschedule for next execution
// 7. find the appointments with the docid
// 8.now retrieve all the appointments that have the same day as the one stored in the collected passed day and store it in an array and also store dates in another array
//9.now delete the appointment
//10.now from the appointment stored in the array find the patient who`s appointment these are and use the date array to make change in patient appointment status
//************************************scheduled-ALGO***************************************/

const agenda = new Agenda({
  db: { address:  process.env.MONGO_URL },
  debug: true,
  maxConcurrency: 10,
});

agenda.define(
  "remove expired availability",

  asyncHandler(async (job) => {
    console.log("|");
    console.log("agenda started");

    const now = moment();
    let next_date;
    let delete_patient_appointment;
    let fetch_patient;
    let unset_Appointmentstatus_of_patient;
    let current_date_patient_filter = [];
    let collect_expire_dates = [];
    let update_data = [];
    let collect_endinfTime = [];
    let collectIdofobjects = [];
    //1
    const { doctorId } = job.attrs.data;
    if (doctorId) {
      console.log("test1-passed");
    } else {
      console.log("test1-failed");
      throw new ApiError(500, "could not find the doctorid");
    }

    //2
    const doctor = await findDoctorId(doctorId);
    if (doctor) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      throw new ApiError(403, `doctor with ${doctorId} not found`);
    }

    //3
    for (let i = 0; i < doctor?.availability?.length; i++) {
      const availabilityDate = doctor?.availability[i]?.date;
      if (!doctor?.availability[i]?.date) {
        console.log(moment(availabilityDate, "MM-DD-YYYY"));
      }
      if (moment(doctor?.availability[i]?.date).isBefore(now)) {
        let isAfterAll = true;
        for (let j = 0; j < doctor?.availability?.length; j++) {
          if (i !== j && moment(availabilityDate, "MM-DD-YYYY").isAfter(now)) {
            isAfterAll = false;
            break;
          }
        }
        if (isAfterAll) {
          update_data.push(doctor?.availability[i]?.day);
          collect_expire_dates.push(doctor?.availability[i]?.date);
          collect_endinfTime.push(doctor?.availability[i]?.end);
          collectIdofobjects.push(doctor?.availability[i]?._id);
        }
      }
    }

    //4
    const normalizedUpdateDay = update_data.map((day) => day.toLowerCase());
    if (normalizedUpdateDay.length > 0) {
    } else {
      console.log("test3->failed");
    }

    //5
    next_date = updateAvailabilityDates(
      normalizedUpdateDay,
      collect_endinfTime
    );
    if (next_date) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      throw new ApiError(500, "no next date");
    }

    //6
    for (let i = 0; i < normalizedUpdateDay?.length; i++) {
      if (doctor?.id) {
        await Doctor.findByIdAndUpdate(
          doctor.id,
          {
            $set: {
              "availability.$[elem].date": next_date[i].date,
              "availability.$[elem].laterNumber": { number: 0 },
            },
          },
          {
            arrayFilters: [{ "elem.day": normalizedUpdateDay[i] }],
            new: true,
          }
        );
      } else {
        throw new ApiError(403, "could not update");
      }

      const job = await mongoose.connection.collection("agendaJobs").findOne({
        "data.objectId": collectIdofobjects[i],
      });
      if (job && job.nextRunAt === null) {
        await mongoose.connection
          .collection("agendaJobs")
          .updateOne(
            { "data.objectId": collectIdofobjects[i] },
            { $set: { nextRunAt: new Date(next_date[i].raegetedTiem) } }
          );
      } else if (job) {
        await mongoose.connection
          .collection("agendaJobs")
          .updateOne(
            { "data.objectId": collectIdofobjects[i] },
            { $set: { nextRunAt: new Date(next_date[i].raegetedTiem) } }
          );
      }
    }

    //7
    const fetch_Patient_id = await Appontment.find({ doctor: doctor?.id });
    if (fetch_Patient_id) {
      console.log("test5->passed");
    } else {
      console.log("test5->failed");
      res
        .status(500)
        .json({ error: "could not find the patient_id  in appointment" });
    }

    //8
    for (let i = 0; i < fetch_Patient_id?.length; i++) {
      for (let j = 0; j < collect_expire_dates?.length; j++) {
        if (
          fetch_Patient_id?.[i].laterPatient[0].date === collect_expire_dates[j]
        ) {
          current_date_patient_filter.push(fetch_Patient_id[i]);
        }
      }
    }
    
    //9
    if (current_date_patient_filter.length > 0) {
      for (let i = 0; i < current_date_patient_filter.length; i++) {
        delete_patient_appointment = await Appontment.findByIdAndDelete(
          current_date_patient_filter[i]._id
        );
      }
      if (delete_patient_appointment) {
        console.log("test6->passed");
        //10
        for (let i = 0; i <= fetch_Patient_id.length - 1; i++) {
          fetch_patient = await User.findById(
            current_date_patient_filter[i].patient.toString()
          );

          for (let j = 0; j <= collect_expire_dates.length - 1; j++) {
            unset_Appointmentstatus_of_patient = await User.findByIdAndUpdate(
              fetch_patient._id,
              {
                $pull: {
                  appointmentStatus: {
                    patient: {
                      $elemMatch: { date: { $in: collect_expire_dates[j] } },
                    },
                  },
                },
              }
            );
          }
        }

        if (fetch_patient && unset_Appointmentstatus_of_patient) {
          console.log("text7->passed");
        } else {
          console.log("text7->failed");
          return message(
            403,
            "could not find the patient with the provided id"
          );
        }
      }
    } else {
      console.log("test6->failed-no appointments");
    }
    console.log("test->completed");
    console.log("|");
    console.log("agenda ended");
  })
);

//************************************start-ALGO***************************************/
//1.fetch all the missedjobs--->[{},{},{}.....n]--->(different objects with multiple doctor id)
//2.collect those jobs that are already executed and are scheduled for next execution--->[{},{},{}.....n]--->(different objects with multiple doctor id)---->collect_executed_jobs=[]
//3.store the lastRunAt in an array(dates will type of Date Object)(lastRunAt will come form missedJobs objects)
//4.extract the day and date form the date objects and store it in an object--->collect_date = [{day:"",date:""}]
//5.loop through the collect_executed_jobs using the docId in the loop loop through another array collect_date and find all the appointments with the docId and date and collect in an array--->store_appointments =[{},{},{}.....n]
//6.form those appointments collected get the docId and look for the doctor ---loop condition---->store_appointments.length
//7.get the availability object of the doc object from the day and date you have
//8.use the date you will get from the doc availability object---->doc_avail_object
//9.search (use find to get an array) for the appointments using the date and store---->find_future_appointments
//10.now the length of find_future_appointments will tell us if there are any previous appointment left if the length matches the number then all the previous appointment were deleted if not then simply updated the patientNUmber
//11.
//************************************start-ALGO***************************************/
// (async () => {
//   await agenda.start();
//   console.log("Agenda  started");
// })();

module.exports = { agenda };
