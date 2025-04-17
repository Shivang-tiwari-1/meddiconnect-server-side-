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
  check_existing_doc,
} = require("../Redis/RedisListOperation/RedisList");
const { createMessage } = require("../Repository/Message.Repo");
const { client } = require("../../Constants");

module.exports = (socket, io) => {
  socket.on("connected", async (userdata, socketid) => {
    //1.
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

    const status = {
      online: true,
      userId: userdata?._id,
      lastActive: new Date().toISOString(),
      role: userdata?.role,
      socketid: socket.id,
    };

    if (userdata?.role === "patient") {
      const existingData = await fetch_data("patient");
      if (existingData?.length > 0) {
        const toObject = parse_data(existingData);
        if (!toObject) {
          throw new ApiError(500, "function failed to parse the data");
        }

        const existing_user = check_existing_doc(toObject, status.userId);
        if (existing_user) {
          const filterdata = fetchToDelete(toObject, userid);
          if (filterdata === undefined) {
            throw new ApiError("could not find  the document");
          }

          const remove_prev_data = await remove_data(
            filterdata?.role,
            filterdata
          );
          if (!remove_prev_data) {
            throw new ApiError(500, "could not remove the prev data ");
          }

          const cacheData = await client.sAdd(
            `isActivePatients`,
            JSON.stringify(status)
          );
          if (cacheData === null || cacheData === undefined) {
            throw new ApiError(500, "Data could not be cached");
          } else {
            console.log("test2->passed");
            return true;
          }
        } else {
          console.warn("adding a new data");
          const cacheData = await client.sAdd(
            `isActivePatients`,
            JSON.stringify(status)
          );
          if (cacheData === null || cacheData === undefined) {
            throw new ApiError(500, "Data could not be cached");
          } else {
            console.log("test2->passed");
            return true;
          }
        }
      } else {
        console.log("redis-set is empty adding a completely new data");
        const cacheData = await client.sAdd(
          `isActivePatients`,
          JSON.stringify(status)
        );
        if (cacheData === null || cacheData === undefined) {
          throw new ApiError(500, "Data could not be cached");
        } else {
          console.log("test2->passed");
          console.log("userid with status is cached done.....");
          console.log("|||");
          return true;
        }
      }
    } else if (userdata?.role === "doctor") {
      const existingData = await fetch_data("doctor");
      if (existingData?.length > 0) {
        const toObject = parse_data(existingData);
        if (!toObject) {
          throw new ApiError(500, "function failed to parse the data");
        }

        const existing_user = check_existing_doc(toObject, status.userId);
        if (existing_user) {
          const filterdata = fetchToDelete(toObject, userid);
          if (filterdata === undefined) {
            throw new ApiError("could not find  the document");
          }

          const remove_prev_data = await remove_data(
            filterdata?.role,
            filterdata
          );
          if (!remove_prev_data) {
            throw new ApiError(500, "could not remove the prev data ");
          }

          const cacheData = await client.sAdd(
            `isActiveDoctors`,
            JSON.stringify(status)
          );
          if (cacheData === null || cacheData === undefined) {
            throw new ApiError(500, "Data could not be cached");
          } else {
            console.log("test2->passed");
            return true;
          }
        } else {
          console.warn("adding a new data");
          const cacheData = await client.sAdd(
            `isActiveDoctors`,
            JSON.stringify(status)
          );
          if (cacheData === null || cacheData === undefined) {
            throw new ApiError(500, "Data could not be cached");
          } else {
            console.log("test2->passed");
            return true;
          }
        }
      } else {
        console.log("redis-set is empty adding a completely new data");
        const cacheData = await client.sAdd(
          `isActiveDoctors`,
          JSON.stringify(status)
        );
        if (cacheData === null || cacheData === undefined) {
          throw new ApiError(500, "Data could not be cached");
        } else {
          console.log("test2->passed");
          console.log("userid with status is cached done.....");
          console.log("|||");
          return true;
        }
      }
    }
  });
  socket.on("reconnect_to_socket", async (data) => {
    const data = await fetch_data(data.role);
    if (data.length > 0) {
      const toJson = parse_data(data);
      if (!toJson) {
        throw new ApiError(500, "could not  parse the data");
      }

      const filterdata = fetchToDelete(toJson, data.userdata.id);
      if (filterdata === undefined) {
        throw new ApiError("could not find  the document");
      }

      const remove = await remove_data(data.role, filterdata);
      if (!remove) {
        throw new ApiError(500, "Data could not be deleted");
      } else {
        console.log("test2->passed");

        const change_filterdata = (filterdata.socketid = data?.socketid);
        if (change_filterdata) {
          throw new ApiError(500, "could not change the object data to false");
        }

        const push_changed_data = await push_data(
          JSON.stringify(filterdata),
          data.role
        );
        if (!push_changed_data) {
          throw new ApiError(500, "could not push the dat ain to redis set ");
        }

      }
    }
  });
  socket.on("join_room", async (roomName) => {
    //1.according to the room name join the room.
    //2.fetch the available online individuals (doctors,patients).
    //3.publish the detail on a channel.
    //4.deliver the data to all the sockets connected to the socket channel(patient_information).
    console.log("---------------||joining-room||----------------");
    if (roomName === "patient_information") {
      try {
        socket.join("patient_information");
        //send online doctors to patient
        const online_doctors = await fetch_data("doctor");
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
              throw new ApiError(500, "there is no active data in redis set");
            }
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
    //1.check if any incoming-data is missing
    //2.find the sender in db
    //3.check if the sender is active
    //4.check if receiver is active(using->id)
    //5.find the receiver in db
    //6.save the message to db
    //7.publish the message on channel(chatbox)
    //8.send the message to the receiver(using->socketid)
    //9.push the message for the sender in to sorted list with a tag
    //10.push the same message for the reviver in to sorted list with a tag

    //1
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
    //2
    const find_sender = await lookup_in_all_collections(sender?.sender);
    if (find_sender) {
      console.log("test2->success");
    } else {
      console.log("test2->failed");
      throw new ApiError(500, "function failed to produce any result");
    }
    //3
    const sender_isActiveDoctors = socketCollection.get(
      find_sender?._id.toString()
    );
    if (sender_isActiveDoctors && sender_isActiveDoctors.active) {
      console.log("test3->passed");
    } else {
      console.log("test3->failed");
      throw new ApiError(500, "sender is not active ");
    }
    //4
    const receiver_isActiveDoctors = socketCollection.get(receiver?.receiver);
    if (receiver_isActiveDoctors && receiver_isActiveDoctors?.active) {
      console.log("test5->passed");
    } else {
      console.log("test5->failed");
    }
    //5
    const find_receiver = await lookup_in_all_collections(receiver?.receiver);
    if (find_receiver) {
      console.log("test6->passed");
    } else {
      console.log("test6->failed");
      throw new ApiError(500, "function failed to produce any result");
    }
    //6
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
    //7
    pub.publish("chatbox", message, (err) => {
      if (err) {
        throw new ApiError(404, `could not publish the message:${err}`);
      } else {
        console.log("**********message-published-to-(chatbox)***********");
      }
    });
    //8
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
    //9
    const time = new Date().getTime();
    const forSender = await redis.zadd(
      `from:${find_sender?._id}:to${find_receiver?._id}`,
      time,
      JSON.stringify({
        text: message,
        role: "me",
      })
    );
    if (forSender === 1) {
      console.log("test9->passed");
    } else {
      console.log("test9->failed");
      throw new ApiError(404, "message was not pushed in the sorted list");
    }
    //10
    const forReciver = await redis.zadd(
      `from:${find_receiver?._id}:to${find_sender?._id}`,
      time,
      JSON.stringify({
        text: message,
        role: "sender",
      })
    );
    if (forReciver) {
      console.log("test10->passed");
    } else {
      console.log("test10->failed");
      throw new Api(404, "message was not pushed in the sorted list");
    }
    console.log("--------|||||sending-message-ends|||||-------");
  });
  socket.on("listening_to_message", async (userid, socketid) => {
    try {
    } catch (error) {}
  });
  socket.on("fetch_from_redis", async (senderid, recipent, role) => {
    console.log(role);
    console.log("||fetching from redis-sorted-set||");

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

      const redis_messages = await redis.zrevrange(
        `from:${sender._id}:to${receiver._id}`,
        0,
        9
      );
      console.log(JSON.stringify(redis_messages));
      const to_string = JSON.stringify(redis_messages);

      if (redis_messages.length !== 0) {
        pub.publish(
          "patient_information_channel",
          JSON.stringify(redis_messages),
          (err) => {
            if (err) {
              throw new ApiError(404, `could not publish the message:${err}`);
            } else {
              console.log(
                "**********redis-message-published-to-(patient_information_channel)***********"
              );
            }
          }
        );

        const deliver_mesage = sending_data(
          {
            io: io,
            role: role,
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
      } else {
        console.log("hello there in no data right now in redis");
      }
      console.log("||fetching from redis-starts||");
    } else if (role === "doctor") {
      const sender = await findDoctorId(senderid);
      if (!sender) {
        throw new ApiError(500, "id is not valid could not find the sender");
      }

      const receiver = await findPatientId(recipent);
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
      if (redis_messages.length !== 0) {
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
            role: role,
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
      } else if (redis_messages === null) {
        console.log("hello there in no data right now in redis");
      }
    }
    console.log("||fetching from redis-sorted-set||");
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
