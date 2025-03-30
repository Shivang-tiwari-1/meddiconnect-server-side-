const { getSocketIo } = require("../../Constants");

exports.ioconnection = async () => {
  const io = await getSocketIo();
  console.log("Socket.IO initialized");
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    console.log("-------------<S_O_C_K_E_T>-------------");
    require("../Socket/socket.Initialization.Work")(socket, io);

    socket.on("error", (error) => {
      console.log("Socket error:", error);
    });
  });
};
