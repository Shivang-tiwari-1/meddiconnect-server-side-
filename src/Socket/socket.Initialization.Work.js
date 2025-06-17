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
  remove_data,
  fetchToDelete,
  push_data,
} = require("../Redis/RedisListOperation/RedisList");
const { createMessage } = require("../Repository/Message.Repo");
const { client } = require("../../Constants");
const {
  check_if_exits,
  push_hash_data,
  fetch_all_data,
  get_hash_online_data,
  parse_hash,
  return_the_doc,
} = require("../Redis/RedisHashFunctions/hash");
const {
  publish_to_patient_information_channel,
} = require("../Redis/publishFunction/publish");
const { fetch_mess_sorted_set } = require("../Redis/SortedSet/SortedSet");

module.exports = (socket, io) => {
  socket.on("connected", async (userdata, socketid, ack) => {
    console.log(
      "||||||||||||||||||||connection-started||||||||||||||||||||||||"
    );
    try {
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
      const datasent = [ ...socketCollection.values() ].find(
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
      //1.store the user in redis(detail)

      const status = {
        online: true,
        userId: userdata?._id,
        lastActive: new Date().toISOString(),
        role: userdata?.role,
        socketid: socket.id,
      };

      if (userdata?.role === "doctor") {
        status.rating = 0;
      }

      const payload = {
        role: userdata?.role,
        id: userdata?._id,
        data: status,
      };

      const pushData = await push_hash_data(payload);
      if (!pushData) {
        throw new ApiError(404, "data was nto pushed");
      }
      ack({ status: "ok" });
      console.log(
        "||||||||||||||||||||connection-finished||||||||||||||||||||||||"
      );
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: error.message || "Internal error" });
    }
    console.log("--------|||||connecting-to-socket-starts|||||-------");
  });
  socket.on("reconnect_to_socket", async (data, ack) => {
    try {
      const Data = await fetch_data(data.role);
      if (data.length === 0) {
        throw new ApiError("could not find  the document");
      }

      const filterdata = fetchToDelete(Data, data.id);
      if (filterdata === undefined) {
        throw new ApiError("could not find  the document");
      }

      const remove = await remove_data(data.role, filterdata);
      if (!remove) {
        throw new ApiError(500, "Data could not be deleted");
      }

      const change_filterdata = (filterdata.socketid);
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
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: error.message || "Internal error" });
    }
    ack.ok({ status: "ok" });
  });
  socket.on("join_room", async (data, ack) => {
    //1.according to the room name join the room.
    //2.fetch the available online individuals (doctors,patients).
    //3.publish the detail on a channel.
    //4.deliver the data to all the sockets connected to the socket channel(patient_information).
    try {
      console.log("---------------||joining-room-starts||----------------");
      if (data?.roomName === "patient_information") {
        try {
          socket.join("patient_information");
          const online_doctors = await fetch_all_data({ role: "doctor" });
          const ratings = await client.hGet(`user:${data?.id}`, `ratings`);
          if (online_doctors) {
            const publishing_data =
              await publish_to_patient_information_channel(
                [
                  online_doctors,
                  JSON.parse(ratings) === null ? [] : JSON.parse(ratings),
                ],
                pub
              );
            if (!publishing_data) {
              throw new ApiError(404, "could not publish the data");
            }

            const deliver_data = sending_data({ io: io }, "online_Status");
            if (!deliver_data) {
              throw new ApiError(500, "function failed to deliver the data");
            }
          }
          console.log(`User ${socket.id} joined room: patient_information`);
        } catch (err) {
          console.error("Could not join the WebSocket room:", err);
        }
      } else if (data?.roomName === "doctor_information") {
        try {
          socket.join("doctor_information");
          console.log(`User ${socket.id} joined room: doctor_information`);
        } catch (err) {
          console.error("Could not join the WebSocket room:", err);
        }
      }
      ack({ status: "ok" });
      console.log("---------------||joining room-ends||----------------");
    } catch (error) {
      console.error(err);
      ack({ status: "error", error: err.message || "Internal error" });
    }
  });
  socket.on("subscribe_events", async (data, events, ack) => {
    console.log("--------|||||subscribing-events-starts|||||-------");
    try {
      console.log("0ccccccccccc", data);
      const host = await get_hash_online_data({ role: data.role, id: data.id });
      if (!host) {
        throw new ApiError(404, "function failed to fetch the result");
      } else {
        const parse = await parse_hash(host);
        if (!parse.online) {
          console.warn("user is not online");
        } else {
          if (events === "ui_update_subs") {
            sub.subscribe("ui_update", (err, count) => {
              if (err) {
                throw new ApiError(
                  404,
                  "could not subscribe to the channel (ui_update)"
                );
              } else {
                console.log(`Subscribed to ${count} ui_update_subs`);
                if (host && host?.online) {
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
                if (parse && parse?.online) {
                  const newPayload = await fetch_all_data({ role: data.role });

                  if (!newPayload) {
                    throw new ApiError(
                      500,
                      "there is no active data in redis set"
                    );
                  }

                  const publish_data_to_patient =
                    await publish_to_patient_information_channel(
                      [ newPayload, [] ],
                      pub
                    );
                  if (!publish_data_to_patient) {
                    throw new ApiError(404, "data could not be published");
                  }

                  const deliver_data = sending_data(
                    { io: io },
                    "online_Status"
                  );
                  if (!deliver_data) {
                    throw new ApiError(
                      500,
                      "function failed to deliver the data"
                    );
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
                console.log(
                  `Subscribed to (patient_information_channel) ${count} `
                );
              }
            });
          }

          if (events === "subscribe_doctor_channel") {
            sub.subscribe("doctor_information_channel", (err, count) => {
              if (err) {
                throw new ApiError(404, "could not subscribe to the chanel");
              } else {
                console.log(
                  `Subscribed to (doctor_information_channel) ${count} `
                );
              }
            });
          }
        }
        ack({ status: "ok" });

        console.log("--------|||||subscribing-events-ends|||||-------");
      }
    } catch (error) {
      console.log(error);
      ack({ status: "error", error: err.message || "Internal error" });
    }
  });
  socket.on("updateProgressBar", async (data, ack) => {
    console.log("--------||||updating-progress-bar-starts|||||-------");
    try {
      const user_detail = await get_hash_online_data(data);
      if (user_detail) {
        const parse = await parse_hash(user_detail);
        if (!parse) {
          console.error("could not find the detail--critical");
        } else {
          if (parse.online && parse.socketid) {
            io.to(parse?.socketid).emit("progressBarUpdate");
            ack({ status: "ok" });
          }
        }
      }
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: err.message || "Internal error" });
    }

    console.log("--------||||updating-progress-bar-ends|||||-------");
  });
  socket.on("ratings", async (data, ack) => {
    try {
      const host = await get_hash_online_data({
        role: data.patientrole,
        id: data.patientId,
      });
      if (!host) {
        throw new ApiError(404, "function failed to fetch the result");
      } else {
        const parsedHost = await parse_hash(host);
        if (parsedHost.role === "doctor") {
          console.warn("accessing unauthorized resource ");
        } else if (!parsedHost.online) {
          console.warn("user is not online");
        } else {
          const get_hash = await client.hGet(
            `user:${parsedHost?.userId}`,
            `ratings`
          );
          if (!get_hash || get_hash === null) {
            console.warn(
              "there is nothing in the redis for this key pushing the current data"
            );
          }

          const parse = get_hash ? await parse_hash(get_hash) : [];
          if (parse.length > 0) {
            const find_hash = parse.find((payload) => {
              return payload.id === data.doctorId;
            });

            if (find_hash.rating !== data.rating && data.rating !== 0) {
              console.log("new rating for the  existing doc");

              const newpaylaod = parse.filter((record) => {
                return record.id !== data.doctorId;
              });
              if (newpaylaod.length !== 0) {
                const deleteKey = await client.hDel(
                  `user:${parsedHost?.userId}`,
                  `ratings`
                );
                if (deleteKey === 0) {
                  throw new ApiError(404, "could not delete ");
                }

                const det_data = await client.hSet(
                  `user:${parsedHost?.userId}`,
                  `ratings`,
                  JSON.stringify(newpaylaod)
                );
                if (det_data === 1) {
                  console.log("✅ New entry added.");
                  return true;
                } else if (det_data === 0) {
                  console.log("🔁 Entry updated.");
                  return true;
                } else {
                  throw new ApiError(404, "could not pus the data ");
                }
              } else {
                console.log("array is empty no point in pushing the data");
              }
            }
          } else {
            const exists = parse.some((record) => {
              console.log(record.id, data.doctorId);
              return record.id === data.doctorId;
            });
            if (!exists) {
              parse.push({
                id: data.doctorId,
                rating: data.rating,
              });

              const det_data = await client.hSet(
                `user:${parsedHost?.userId}`,
                `ratings`,
                JSON.stringify(parse)
              );
              if (det_data === 1) {
                console.log("✅ New entry added.");
                return true;
              } else if (det_data === 0) {
                console.log("🔁 Entry updated.");
                return true;
              } else {
                throw new ApiError(404, "could not pus the data ");
              }
            } else {
              console.warn("same data already exists");
            }
          }
        }
      }

      ack({ status: "ok" });
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: error.message || "Internal error" });
    }
  });
  socket.on(
    "sending_message",
    async (receiver, sender, socketid, message, role, ack) => {
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

      try {

        //1
        const sender_isActiveDoctors = await return_the_doc({
          role: role,
          id: sender?.sender
        })
        if (sender_isActiveDoctors && sender_isActiveDoctors?.online) {
          console.log("test3->passed");
        } else {
          console.log("test3->failed");
          throw new ApiError(500, "sender is not active ");
        }

        //2
        const receiver_isActiveDoctors = await return_the_doc({
          role: role === 'patient' ? 'doctor' : role,
          id: receiver?.receiver
        })
        if (receiver_isActiveDoctors && receiver_isActiveDoctors?.online) {
          console.log("test5->passed");
        } else {
          console.log("test5->failed");
        }


        //3
        pub.publish("chatbox", message, (err) => {
          if (err) {
            throw new ApiError(404, `could not publish the message:${err}`);
          } else {
            console.log("**********message-published-to-(chatbox)***********");
          }
        });

        //4
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

        //5
        const forSender = await redis.zadd(
          `from:${find_sender?._id}:to${find_receiver?._id}`,
          new Date().getTime(),
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

        //6
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
        ack({ status: "ok" });
        console.log("--------|||||sending-message-ends|||||-------");
      } catch (error) {
        console.error(error);
        ack({ status: "error", error: err.message || "Internal error" });
      }
    }
  );
  socket.on("fetch_from_redis", async (senderid, recipent, role, page, ack) => {
    console.log("||fetching from redis-sorted-set||");
    try {
      const get_data_from_coll = await return_the_doc({
        id: senderid,
        role: role,
      });
      if (!get_data_from_coll) {
        throw new ApiError(500, "could not find the user in socketcollection");
      }

      const redis_messages = await fetch_mess_sorted_set({
        Limit: (Limit = 10),
        skip: (skip = (page - 1) * Limit),
        senderid: senderid,
        recipent: recipent,
      });
      if (!redis_messages) {
        throw new ApiError(500, "could not find any messages");
      }

      const messages = [];
      for (let i = 0; i < redis_messages.length; i += 2) {
        messages.push({
          message: redis_messages[ i ],
          timestamp: Number(redis_messages[ i + 1 ]),
        });
      }
      if (redis_messages.length === 0 || messages.length === 0) {
        console.log("hello there in no data right now in redis");
      }

      const publish_id_to_patient =
        await publish_to_patient_information_channel(
          {
            data: messages,
            role: role,
          },
          pub
        );
      if (!publish_id_to_patient) {
        throw new ApiError(500, "could not publish any messages");
      }

      const deliver_mesage = sending_data(
        {
          io: io,
          role: role,
          reciverSocketid: get_data_from_coll?.socketid,
        },
        "redis_messages"
      );
      if (!deliver_mesage) {
        throw new ApiError(404, "data is pushed in the redis-list");
      }
      console.log("||fetching from redis-starts||");
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: error.message || "Internal error" });
    }

    ack({ status: "ok" });

    console.log("||fetching from redis-sorted-set||");
  });
  socket.on("manual-disconnect", async (data, ack) => {
    console.log("manual-disconnect-started");

    try {
      const payload = {
        role: data.role,
        id: data.id,
      };

      const check_if_user_exists = await check_if_exits(payload);
      if (!check_if_user_exists) {
        console.warn("user does not exist");
        console.log("ending the procedure");
      } else {
        const is_active = await get_hash_online_data(payload);
        if (is_active) {
          const parse = await parse_hash(is_active);
          if (!parse) {
            throw new ApiError(404, "could not parse");
          } else if (!parse.online) {
            console.warn("user is not online");
          } else {
            parse.online = false;
            parse.socketid = null;
            parse.lastActive = new Date().toISOString();

            const pushing = await push_hash_data({
              role: data.role,
              id: data.id,
              data: parse,
            });

            const fetch_online_doc = await fetch_all_data(payload);
            if (!fetch_online_doc) {
              throw new ApiError(404, "there is no data");
            }

            const publish_id_to_patient =
              await publish_to_patient_information_channel(
                { data: data?.id, role: data.role },
                pub
              );
            if (!publish_id_to_patient) {
              throw new ApiError(404, `could not publish the message: ${err}`);
            }

            const offline_data = sending_data({ io: io }, "offline_status");
            if (!offline_data) {
              throw new ApiError(500, "function failed to deliver the data");
            }

            const newPayload = await fetch_all_data(payload);
            if (!newPayload) {
              throw new ApiError(404, "empty fetch");
            }

            const publish_data_to_patient =
              await publish_to_patient_information_channel(
                { data: [ newPayload, [] ], role: data?.role },
                pub
              );
            if (!publish_data_to_patient) {
              throw new ApiError(404, "data could not be published");
            }

            const online_data = sending_data({ io: io }, "online_Status");
            if (!online_data) {
              throw new ApiError(500, "function failed to deliver the data");
            }
          }
        }
      }
      ack({ status: "ok" });
    } catch (error) {
      console.error(error);
      ack({ status: "error", error: err.message || "Internal error" });
    }
  });
  socket.on("disconnect", async () => {
    console.log("disconnected");
    // const socketid = [...socketCollection.values()].find(
    //   (index) => index.socketid === socket.id
    // );
    // const data = await fetch_all_data(socketid.role);
    // if (data.length === 0) {
    //   console.warn("redis-list was empty");
    // } else {
    //   const toJson = parse_data(data);
    //   if (!toJson) {
    //     throw new ApiError(500, "could not  parse the data");
    //   }

    //   const filterdata = fetchToDelete(toJson, socketid.userId);
    //   if (filterdata === undefined) {
    //     throw new ApiError("could not find  the document");
    //   }

    //   const remove = await remove_data(socketid.role, filterdata);
    //   if (!remove) {
    //     throw new ApiError(500, "Data could not be deleted");
    //   } else {
    //     console.log("test2->passed");
    //     const change_filterdata = (filterdata.online = false);
    //     const change_time = (filterdata.lastActive = new Date().toISOString());
    //     if (change_filterdata && change_time) {
    //       throw new ApiError(500, "could not change the object data to false");
    //     }

    //     const push_offline_status = await push_data(
    //       JSON.stringify(filterdata),
    //       socketid.role
    //     );
    //     if (!push_offline_status) {
    //       throw new ApiError(500, "could not push the dat ain to redis set ");
    //     }

    //     pub.publish(
    //       "patient_information_channel",
    //       JSON.stringify(socketid?.userId),
    //       (err) => {
    //         if (err) {
    //           throw new ApiError(404, `could not publish the message:${err}`);
    //         } else {
    //           console.log(
    //             "**********data-published-to-(patient_information_channel)***********"
    //           );
    //         }
    //       }
    //     );

    //     const deliver_id = sending_data({ io: io }, "offline_status");
    //     if (!deliver_id) {
    //       throw new ApiError(500, "function failed to deliver the data");
    //     }

    //     const data = await fetch_data(socketid.role);
    //     if (!data) {
    //       throw new ApiError(500, "redis list is empty");
    //     }

    //     const toJson2 = parse_data(data);
    //     if (!toJson2) {
    //       throw new ApiError(500, "could not  parse the data");
    //     }

    //     pub.publish(
    //       "patient_information_channel",
    //       JSON.stringify(toJson2),
    //       (err) => {
    //         if (err) {
    //           throw new ApiError(404, `could not publish the message:${err}`);
    //         } else {
    //           console.log(
    //             "**********data-published-to-(patient_information_channel)***********"
    //           );
    //         }
    //       }
    //     );

    //     const deliver_data = sending_data({ io: io }, "online_Status");
    //     if (!deliver_data) {
    //       throw new ApiError(500, "function failed to deliver the data");
    //     }
    //   }
    // }
  });
  socket.on("reconnect_attempt", async () => {
    console.log("attempting to re-connect");
  });
};
