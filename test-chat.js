const io = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to chat server with id: " + socket.id);
  socket.emit("chatMessage", {
    room: "general",
    user: "Aditi",
    message: "Hey team, backend is ready 🚀"
  });
  socket.emit("chatMessage", {
    room: "general",
    user: "Rohan",
    message: "Testing chat now..."
  });
  socket.emit("chatMessage", {
    room: "general",
    user: "Aditi",
    message: "Messages arriving in real time ⚡"
  });
});

socket.on("chatMessage", (data) => {
  if (typeof data === "object" && data.message) {
    console.log("[" + (data.room || "general") + "] " + data.user + ": " + data.message);
  } else {
    console.log("Broadcast received: " + data);
  }
  setTimeout(() => {
    socket.disconnect();
  }, 200);
});

socket.on("disconnect", () => {
  console.log("Disconnected from chat server");
  process.exit(0);
});
