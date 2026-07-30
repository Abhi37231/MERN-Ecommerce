const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ShopSphere API 🚀",
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running perfectly.",
  });
});

module.exports = app;