const io = require("socket.io-client");

const socket = io("http://localhost:5001");

socket.on("connect", () => {
  console.log("Connected to chat server with id: " + socket.id);
  socket.emit("chatMessage", "Hello from client");
});

socket.on("chatMessage", (message) => {
  console.log("Broadcast received: " + message);
  socket.disconnect();
});

socket.on("disconnect", () => {
  console.log("Disconnected from chat server");
  process.exit(0);
});
