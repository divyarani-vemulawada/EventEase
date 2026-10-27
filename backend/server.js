
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const eventsRouter = require("./routes/events");

const authRoutes = require("./routes/auth");

const registrationRoutes = require("./routes/registrations");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "EventEase API is running!",
    status: "success",
  });
});

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    application: "EventEase",
  });
});

// Events routes
app.use("/api/events", eventsRouter);

//Auth routes
app.use("/api/auth", authRoutes);

//registrations routes
app.use("/api/registrations", registrationRoutes);

app.listen(PORT, () => {
  console.log(`EventEase API running at http://localhost:${PORT}`);
});
