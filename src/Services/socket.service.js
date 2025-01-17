const { getSocketIo } = require("../../Constants");

exports.emit_Notification = async (id, message, socketCollection) => {
  try {
    const io = getSocketIo();
    if (
      typeof id === "string" &&
      typeof message === "string" &&
      id &&
      message
    ) {
      const lookUp = [...socketCollection.values()].find(
        (index) => index.userId === id
      );
      if (lookUp) {
        io.to(lookUp.socketid).emit("liveMessage", message);
        return true;
      } else {
        return false;
      }
    }
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};
