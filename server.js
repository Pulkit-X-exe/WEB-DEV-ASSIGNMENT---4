const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("Secure Connect API is running");
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
