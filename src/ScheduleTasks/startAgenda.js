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
//************************************start-ALGO***************************************/

const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const User = require("../Models/User.Model");
const moment = require("moment");
const Appontment = require("../Models/Appointment.Models");
const { default: mongoose } = require("mongoose");
const { agenda } = require("./agend.ScheduleTasks");

async function processMissedJobs() {
  console.log(
    "-------------------start-agenda-logic--------------------------"
  );
  await agenda.start();

  const AgendaJob = mongoose.model(
    "agendaJobs",
    new mongoose.Schema({}),
    "agendaJobs"
  );
  const missedJobs = await AgendaJob.find({
    name: "remove expired availability",
  }).lean();

  const collect_executed_jobs = missedJobs.filter(
    (job) => job.lastRunAt != null
  );
  if (collect_executed_jobs.length > 0 && collect_executed_jobs) {
    let collect_date = [];
    let store_appointments = [];

    collect_executed_jobs.forEach((collectDate) => {
      const dateObj = new Date(collectDate?.lastRunAt);
      const date = moment(dateObj).format("MM-DD-YYYY");
      const day = moment(dateObj).format("dddd").toLowerCase();
   
        collect_date.push({
          day: day,
          date: date,
        });
      
    });

    for (let i = 0; i <= collect_executed_jobs.length - 1; i++) {
      const doctorID = collect_executed_jobs[i].data.doctorId;
      const date = collect_date[i].date;
      if (doctorID) {
        const find_appointment = await Appontment.find({
          doctor: doctorID,
          "laterPatient.date": date,
        });
        find_appointment?.length > 0 &&
          store_appointments.push(find_appointment[0]);
      }
    }

    if (store_appointments.length > 0) {
      for (let i = 0; i <= store_appointments.length - 1; i++) {
        const find_doctor = await Doctor.findById(store_appointments[i].doctor);
        if (!find_doctor) {
          throw new ApiError(403, "could not find the doctor critical error");
        } else {
          const doc_avail_object = find_doctor?.availability?.find((index) => {
            return index.day === store_appointments[i]?.laterPatient[0].day;
          });
          if (
            !doc_avail_object &&
            doc_avail_object === undefined &&
            typeof doc_avail_object !== "object"
          ) {
            throw new ApiError(
              500,
              "no such appointment exists with that particular date"
            );
          } else {
            const find_future_appointments = await Appontment.find({
              doctor: find_doctor?.id,
              "laterPatient.date": doc_avail_object.date,
              "laterPatient.day": doc_avail_object.day,
            });

            console.log("find_future_appointments->", find_future_appointments);
            if (
              find_future_appointments &&
              Array.isArray(find_future_appointments)
            ) {
              const update_doctor = Doctor.findOneAndUpdate(
                { _id: find_doctor?.id },
                {
                  $set: {
                    "availability.$[elem].laterNumber.number": {
                      number: find_future_appointments.length,
                    },
                  },
                },
                {
                  arrayFilters: [{ "elem.day": doc_avail_object.day }],
                  new: true,
                }
              );
              if (!update_doctor) {
                throw new ApiError(403, "could not update the doctor");
              } else {
                const find_patient = await User.findById(
                  store_appointments[i].patient
                );
                if (!find_patient) {
                  throw new ApiError(
                    403,
                    "could not find the user critical error"
                  );
                } else {
                  const update_patient = await User.findByIdAndUpdate(
                    find_patient?._id?.toString(),
                    {
                      $pull: {
                        appointmentStatus: {
                          "patient.date":
                            store_appointments[i].laterPatient[0].date,
                        },
                      },
                    }
                  );

                  if (!update_patient) {
                    throw new ApiError(403, "could not update the patient");
                  } else {
                    const delete_Appointment =
                      await Appontment.findByIdAndDelete(
                        store_appointments[i]._id
                      );
                    if (!delete_Appointment) {
                      throw new ApiError(
                        500,
                        "could not delte the appointment"
                      );
                    }
                  }
                }
              }
            } else {
              throw new ApiError(500, "something went wrong");
            }
          }
        }
      }
    } else {
      console.log("no previous appointments to delete");
    }
  }
  console.log(
    "-------------------ending-agenda-logic--------------------------"
  );
}

module.exports = processMissedJobs;
