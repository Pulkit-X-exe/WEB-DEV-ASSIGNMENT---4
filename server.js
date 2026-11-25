const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api", authRoutes);
app.use("/notes", noteRoutes);
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("Secure Connect API is running");
});

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);
  socket.join("general");
  console.log(socket.id + " joined room general");

  socket.on("chatMessage", (data) => {
    if (typeof data === "object" && data.user && data.message) {
      console.log("[" + (data.room || "general") + "] " + data.user + ": " + data.message);
      io.to(data.room || "general").emit("chatMessage", data);
    } else {
      console.log("Message received: " + data);
      io.emit("chatMessage", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

server.listen(port, () => {
  console.log("Server is running on port " + port);
  console.log("[server] listening on http://localhost:" + port);
});
