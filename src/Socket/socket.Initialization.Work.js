const { socketCollection, pub, sub } = require("../../Constants");
const {
  getNotificationOdthePatient,
  getNotificationOdtheDoctor,
} = require("../Repository/NotificationRepository");
const {
  findDoctorId,
  findPatient,
  findPatientId,
  lookup_in_all_collections,
} = require("../Repository/userRepository");
const { getNotificationService } = require("../Services/notificationServices");
const ApiError = require("../Utils/Apierror.Utils");
const { createMessage } = require("../Repository/Message.Repo");
module.exports = (socket, io) => {
  socket.on("connected", async (userdata, socketid) => {
    if (socketCollection.size === 0) {
      socketCollection.set(userdata?._id?.toString(), {
        name: userdata?.name,
        userId: userdata?._id?.toString(),
        socketid: socket.id,
        active: true,
        dataSent: false,
        role: userdata?.role,
      });
    } else {
      socketCollection.set(userdata?._id?.toString(), {
        name: userdata?.name,
        userId: userdata?._id?.toString(),
        socketid: socket.id,
        active: true,
        dataSent: false,
        role: userdata?.role,
      });
    }
    console.log("from---backend-->", socketCollection);
    const datasent = [...socketCollection.values()].find(
      (user) => user.dataSent === false
    );

    sub.unsubscribe(`user:${userdata?._id}`, () => {
      sub.subscribe(`user:${userdata?._id}`, (err) => {
        if (err) {
          throw new ApiError(404, "could not connect to the channel");
        }
      });
    });

    if (datasent && !datasent.dataSent) {
      let user;

      if (userdata?.role === "patient") {
        user = await findPatient(userdata?._id);
      } else {
        user = await findDoctorId(userdata?._id);
      }

      if (!user) {
        return false;
      } else {
        let user_data;
        if (user.role === "patient") {
          user_data = await getNotificationOdthePatient(
            userdata?._id?.toString()
          );
        } else {
          user_data = await getNotificationOdtheDoctor(
            userdata?._id?.toString()
          );
        }

        if (user_data) {
          const data = getNotificationService(user_data);
          if (data) {
            for (let message of data) {
              io.to(socketid).emit("message", message);
            }

            socketCollection.forEach((value, key) => {
              if (value.userId === userdata?._id?.toString()) {
                value.dataSent = true;
                socketCollection.set(key, value);
              }
            });
          }
        }
      }
    }
  });

  socket.on("sending_message", async (receiver, sender, socketid, message) => {
    if (
      typeof sender === "object" &&
      typeof socketid === "string" &&
      typeof message === "string" &&
      typeof receiver === "object" &&
      sender &&
      socketid &&
      message &&
      receiver
    ) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      throw new ApiError(
        500,
        `${receiverid},${socketid},${message} is missing`
      );
    }

    const find_sender = await lookup_in_all_collections(sender?.sender);
    if (find_sender) {
      console.log("test2->success");
    } else {
      console.log("test2->failed");
      throw new ApiError(500, "function failed to produce any result");
    }

    const find_receiver = await lookup_in_all_collections(receiver?.receiver);
    if (find_receiver) {
      console.log("test3->passed");
    } else {
      console.log("test3->failed");
      throw new ApiError(500, "function failed to produce any result");
    }
    const save_to_db = await createMessage(
      find_sender?._id,
      find_receiver?._id,
      receiver?.role,
      message
    );
    if (save_to_db) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      throw new ApiError(500, "function failed to create the message");
    }

    pub.publish(`user:${find_receiver?._id}`, message, (err) => {
      if (err) {
        throw new ApiError(404, `could not publish the message to redis${err}`);
      }
    });
    console.log(socketid);
    sub.on("message", (message, err) => {
      if (err) {
        throw new ApiError(404, `Could not deliver the message:${message}`);
      } else {
        console.log("Sending the message");
        io.to(socketid).emit("listen_to_message", {
          role: "sender",
          text: message,
          user_Role: find_receiver?.role,
        });
      }
    });
  });

  socket.on("listening_to_message", async (userid, socketid) => {
    try {
    } catch (error) {}
  });

  socket.on("disconnect", async () => {
    try {
      console.log("discoonected");
      const socketid = [...socketCollection.values()].find(
        (index) => index.socketid === socket.id
      );

      if (socketid?.role === "patient") {
        const find_patient = await findPatientId(socketid?.id);
        if (find_patient) {
          find_patient.isActive = false;
          await find_patient.save();
        }
      } else {
        const find_Doctor = await findDoctorId(socketid?.userId);
        if (find_Doctor) {
          find_Doctor.isActive = false;
          await find_Doctor.save();
        }
      }
    } catch (err) {
      console.error("Error during disconnect:", err);
    }
  });
};
