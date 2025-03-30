const { socketCollection, pub, sub, redis } = require("../../Constants");
const {
  getNotificationOdthePatient,
  getNotificationOdtheDoctor,
} = require("../Repository/NotificationRepository");
const {
  findDoctorId,
  findPatientId,
  lookup_in_all_collections,
} = require("../Repository/userRepository");
const { getNotificationService } = require("../Services/notificationServices");
const ApiError = require("../Utils/Apierror.Utils");
const { sending_data } = require("../Redis/RedisListners.js/eventListner");
const {
  fetch_data,
  parse_data,
  remove_data,
  fetchToDelete,
  push_data,
} = require("../Redis/RedisListOperation/RedisList");
const { createMessage } = require("../Repository/Message.Repo");
const { client } = require("../../Constants");

module.exports = (socket, io) => {
  socket.on("connected", async (userdata, socketid) => {
    console.log("--------|||||connecting-to-socket-starts|||||-------");
    if (!socketid || !userdata) {
      throw new ApiError(404, "user id and socket id not present ");
    }
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
    const datasent = [...socketCollection.values()].find(
      (user) => user.dataSent === false
    );
    console.log(socketCollection);
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
        user = await findPatientId(userdata?._id);
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
    console.log("--------|||||connecting-to-socket-ends|||||-------");
  });
  socket.on("join_room", async (roomName) => {
    console.log("---------------||joining room||----------------");
    if (roomName === "patient_information") {
      try {
        socket.join("patient_information");
        //send online doctors to patient
        const online_doctors = await fetch_data("doctor");
        console.log("online_doctor", online_doctors);
        if (online_doctors.length === 0) {
          console.log("no doctor is online ");
        } else {
          const toJson = parse_data(online_doctors);
          if (!toJson) {
            throw new ApiError(500, "could not  parse the data");
          }

          pub.publish(
            "patient_information_channel",
            JSON.stringify(toJson),
            (err) => {
              if (err) {
                throw new ApiError(404, `could not publish the message:${err}`);
              } else {
                console.log(
                  "**********data-published-to-(patient_information_channel)***********"
                );
              }
            }
          );

          const deliver_data = sending_data({ io: io }, "online_Status");
          if (!deliver_data) {
            throw new ApiError(500, "fucntion failed to deliver the data");
          }
        }
        console.log(`User ${socket.id} joined room: patient_information`);
      } catch (err) {
        console.error("Could not join the WebSocket room:", err);
      }
    } else if (roomName === "doctor_information") {
      try {
        socket.join("doctor_information");
        console.log(`User ${socket.id} joined room: doctor_information`);
      } catch (err) {
        console.error("Could not join the WebSocket room:", err);
      }
    }
    console.log("---------------||joining room||----------------");
  });
  socket.on("subscribe_events", async (id, events) => {
    console.log("--------|||||subscribing-events-starts|||||-------");
    const host = socketCollection.get(id);
    if (events === "ui_update_subs") {
      sub.subscribe("ui_update", (err, count) => {
        if (err) {
          throw new ApiError(
            404,
            "could not subscribe to the channel (ui_update)"
          );
        } else {
          console.log(`Subscribed to ${count} ui_update_subs`);
          if (host && host?.active) {
            io.to(host.socketid).emit("nav_chat_icon_update");
          }
        }
      });
    }

    if (events === "is_active_ui_update_subs") {
      sub.subscribe("is_active_ui_update", async (err, count) => {
        if (err) {
          throw new ApiError(
            404,
            "could not subscribe to the channel (is_active_ui_update)"
          );
        } else {
          //handling doctor active status
          if (host && host?.active) {
            const check_active_in_redis = await fetch_data("doctor");
            if (!check_active_in_redis) {
              throw new ApiError(500, "there is not active data in redis set");
            }
            console.log("check_active_in_redis", check_active_in_redis);
            const toObject = parse_data(check_active_in_redis);
            if (!toObject) {
              throw new ApiError(500, "could not parse the data");
            }

            pub.publish(
              "patient_information_channel",
              JSON.stringify(toObject),
              (err) => {
                if (err) {
                  throw new ApiError(
                    404,
                    `could not publish the message:${err}`
                  );
                } else {
                  console.log(
                    "**********data-published-to-(patient_information_channel)***********"
                  );
                }
              }
            );

            const deliver_data = sending_data({ io: io }, "online_Status");
            if (!deliver_data) {
              throw new ApiError(500, "fucntion failed to deliver the data");
            }
          }
        }
      });
    }

    if (events === "subscribe_message_channel") {
      sub.subscribe(`chatbox`, (err, count) => {
        if (err) {
          throw new ApiError(404, "could not subscribe to the chanel");
        } else {
          console.log(`Subscribed to ${count} chatbox`);
        }
      });
    }

    if (events === "subscribe_patient_channel") {
      sub.subscribe("patient_information_channel", (err, count) => {
        if (err) {
          throw new ApiError(404, "could not subscribe to the chanel");
        } else {
          console.log(`Subscribed to (patient_information_channel) ${count} `);
        }
      });
    }

    if (events === "subscribe_doctor_channel") {
      sub.subscribe("doctor_information_channel", (err, count) => {
        if (err) {
          throw new ApiError(404, "could not subscribe to the chanel");
        } else {
          console.log(`Subscribed to (doctor_information_channel) ${count} `);
        }
      });
    }
    console.log("--------|||||subscribing-events-ends|||||-------");
  });
  socket.on("single_doctor_active", async (id) => {
    console.log("--------|||||single_doctor_active|||||-------");

    const data = socketCollection.get(typeof id !== "string" && String(id));
    if (data) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
    }

    const check_active_in_redis = await client.hGet(
      `isActiveDoctors:${data?.userId}`,
      "userstatus"
    );
    if (check_active_in_redis !== null) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
    }

    const toObject = JSON.parse(check_active_in_redis);
    if (typeof toObject === "object" && toObject) {
      console.log("test3->passed");
      io.to(data?.socketid).emit("single_doc_active", toObject);
    } else {
      console.log("test3->failed");
    }

    console.log("--------|||||single_doctor_active|||||-------");
  });
  socket.on("updateProgressBar", (id) => {
    console.log("--------||||updating-progress-bar-starts|||||-------");

    const user_detail = socketCollection.get(id.toString());
    console.log(id, user_detail);
    if (!user_detail) {
      console.error("could not find the detail--critical");
    } else {
      if (user_detail.active && user_detail.socketid) {
        io.to(user_detail?.socketid).emit("progressBarUpdate");
      }
    }
    console.log("--------||||updating-progress-bar-ends|||||-------");
  });
  socket.on("sending_message", async (receiver, sender, socketid, message) => {
    console.log("--------|||||sending-message-starts|||||-------");
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

    const sender_isActiveDoctors = socketCollection.get(
      find_sender?._id.toString()
    );
    if (sender_isActiveDoctors && sender_isActiveDoctors.active) {
      console.log("test3->passed");
    } else {
      console.log("test3->failed");
      throw new ApiError(500, "sender is not active ");
    }

    const receiver_isActiveDoctors = socketCollection.get(receiver?.receiver);
    if (receiver_isActiveDoctors && receiver_isActiveDoctors?.active) {
      console.log("test5->passed");
    } else {
      console.log("test5->failed");
    }

    const find_receiver = await lookup_in_all_collections(receiver?.receiver);
    if (find_receiver) {
      console.log("test6->passed");
    } else {
      console.log("test6->failed");
      throw new ApiError(500, "function failed to produce any result");
    }

    const save_to_db = await createMessage(
      find_sender?._id,
      find_receiver?._id,
      sender?.role,
      message
    );
    if (save_to_db) {
      console.log("test7->passed");
    } else {
      console.log("test7->failed");
      throw new ApiError(500, "function failed to create the message");
    }

    pub.publish("chatbox", message, (err) => {
      if (err) {
        throw new ApiError(404, `could not publish the message:${err}`);
      } else {
        console.log("**********message-published-to-(chatbox)***********");
      }
    });

    const deliver_mesage = sending_data(
      {
        io: io,
        reciverSocketid: receiver_isActiveDoctors?.socketid,
        role: "sender",
        user_Role: find_receiver?.role,
        message: message,
      },
      "text_message"
    );
    if (deliver_mesage) {
      console.log("test8->passed");
    } else {
      console.log("test8->failed");
      throw new ApiError(404, "data is pushed in the redis-list");
    }

    const previousMessages = await client.hGet(
      `messages:${find_sender?._id}`,
      `with${find_receiver?._id}`
    );
    const parsedMessages = previousMessages ? JSON.parse(previousMessages) : [];
    console.log("parsedMessage", parsedMessages);
    const push_redis_list = await client.hSet(
      `messages:${find_sender?._id}`,
      `with${find_receiver?._id}`,
      JSON.stringify([
        ...parsedMessages,
        {
          text: message ?? "",
          time: new Date().toISOString(),
          read: false,
          messageTo: find_receiver?.role,
        },
      ])
    );
    if (push_redis_list >= 0) {
      console.log("test9->passed");
    } else {
      console.log("test9->failed");
      throw new ApiError(404, "data is pushed in the redis-list");
    }

    const check_existing_receiver = await client.hExists(
      `messages:${find_receiver?._id}`,
      `with${find_sender?._id}`
    );
    if (check_existing_receiver) {
      const previousMessages2 = await client.hGet(
        `messages:${find_receiver?._id}`,
        `with${find_sender?._id}`
      );

      const parsedMessages2 = previousMessages2
        ? JSON.parse(previousMessages2)
        : [];

      console.log("parsedMessages2", parsedMessages2);
      const push_redis_list = await client.hSet(
        `messages:${find_receiver?._id}`,
        `with${find_sender?._id}`,
        JSON.stringify([
          ...parsedMessages2,
          {
            text: message ?? "",
          },
        ])
      );
      if (push_redis_list >= 0) {
        console.log("test10->passed");
      } else {
        console.log("test10->failed");
        throw new ApiError(404, "data is pushed in the redis-list");
      }
    } else {
      console.log(
        "there is  not receiver yet in redis-set to allocate this message to creating one to allocate message to "
      );
      const push_redis_list = await client.hSet(
        `messages:${find_receiver?._id}`,
        `with${find_sender?._id}`,
        JSON.stringify([
          {
            text: message ?? "",
          },
        ])
      );
      if (push_redis_list) {
        console.log("test10->passed");
      } else {
        console.log("test10->failed");
        throw new ApiError(404, "data is pushed in the redis-list");
      }
    }

    console.log("--------|||||sending-message-ends|||||-------");
  });
  socket.on("listening_to_message", async (userid, socketid) => {
    try {
    } catch (error) {}
  });
  socket.on("fetch_from_redis", async (senderid, recipent, role) => {
    console.log("||fetching from redis-starts||", role);

    if (role === "patient") {
      const sender = await findPatientId(senderid);
      if (!sender) {
        throw new ApiError(500, "id is not valid could not find the sender");
      }

      const receiver = await findDoctorId(recipent);
      if (!receiver) {
        throw new ApiError(500, "id is not valid could not find the receiver");
      }

      const get_data_from_coll = socketCollection.get(senderid);
      if (!get_data_from_coll) {
        throw new ApiError(500, "could nto find the user in socketcollection");
      }

      const redis_messages = await client.hGet(
        `messages:${sender?._id}`,
        `with${receiver?._id}`
      );
      if (redis_messages.length > 0) {
        pub.publish("patient_information_channel", redis_messages, (err) => {
          if (err) {
            throw new ApiError(404, `could not publish the message:${err}`);
          } else {
            console.log(
              "**********redis-message-published-to-(patient_information_channel)***********"
            );
          }
        });

        const deliver_mesage = sending_data(
          {
            io: io,
            reciverSocketid: get_data_from_coll?.socketid,
          },
          "redis_messages"
        );
        if (deliver_mesage) {
          console.log("test8->passed");
        } else {
          console.log("test8->failed");
          throw new ApiError(404, "data is pushed in the redis-list");
        }
      }
      console.log("||fetching from redis-starts||");
    } else if (role === "doctor") {
      console.log(
        "hello ther in the socket waiting for further implementation "
      );
    }
  });
  socket.on("disconnect", async () => {
    console.log("disconnected");
    const socketid = [...socketCollection.values()].find(
      (index) => index.socketid === socket.id
    );
    //handling the online status
    const data = await fetch_data(socketid.role);
    if (data.length === 0) {
      console.warn("redis-list was empty");
    } else {
      const toJson = parse_data(data);
      if (!toJson) {
        throw new ApiError(500, "could not  parse the data");
      }

      const filterdata = fetchToDelete(toJson, socketid.userId);
      if (filterdata === undefined) {
        throw new ApiError("could not find  the document");
      }

      const remove = await remove_data(socketid.role, filterdata);
      if (!remove) {
        throw new ApiError(500, "Data could not be deleted");
      } else {
        console.log("test2->passed");

        const change_filterdata = (filterdata.online = false);
        const change_time = (filterdata.lastActive = new Date().toISOString());
        if (change_filterdata && change_time) {
          throw new ApiError(500, "could not change the object data to false");
        }

        const push_offline_status = await push_data(
          JSON.stringify(filterdata),
          socketid.role
        );
        if (!push_offline_status) {
          throw new ApiError(500, "could not push the dat ain to redis set ");
        }

        pub.publish(
          "patient_information_channel",
          JSON.stringify(socketid?.userId),
          (err) => {
            if (err) {
              throw new ApiError(404, `could not publish the message:${err}`);
            } else {
              console.log(
                "**********data-published-to-(patient_information_channel)***********"
              );
            }
          }
        );

        const deliver_id = sending_data({ io: io }, "offline_status");
        if (!deliver_id) {
          throw new ApiError(500, "function failed to deliver the data");
        }

        const data = await fetch_data(socketid.role);
        if (!data) {
          throw new ApiError(500, "redis list is empty");
        }

        const toJson2 = parse_data(data);
        if (!toJson2) {
          throw new ApiError(500, "could not  parse the data");
        }

        pub.publish(
          "patient_information_channel",
          JSON.stringify(toJson2),
          (err) => {
            if (err) {
              throw new ApiError(404, `could not publish the message:${err}`);
            } else {
              console.log(
                "**********data-published-to-(patient_information_channel)***********"
              );
            }
          }
        );

        const deliver_data = sending_data({ io: io }, "online_Status");
        if (!deliver_data) {
          throw new ApiError(500, "function failed to deliver the data");
        }
      }
    }
  });
};
