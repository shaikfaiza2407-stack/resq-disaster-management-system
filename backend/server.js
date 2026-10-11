
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Disaster = require("./models/Disaster");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Test route
app.get("/", (req, res) => {
  res.send("Disaster Management Backend is running!");
});

// Get all disaster reports
app.get("/api/disasters", async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ createdAt: -1 });
    res.status(200).json(disasters);
  } catch (error) {
    console.error("Fetch reports failed:", error.message);
    res.status(500).json({
      message: "Failed to fetch disaster reports",
    });
  }
});

// Submit a new disaster report
app.post("/api/disasters", async (req, res) => {
  try {
    const { disasterType, location, severity, description } = req.body;

    if (
      !disasterType?.trim() ||
      !location?.trim() ||
      !severity ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const disaster = await Disaster.create({
      disasterType: disasterType.trim(),
      location: location.trim(),
      severity,
      description: description.trim(),
    });

    res.status(201).json({
      message: "Disaster report submitted successfully",
      disaster,
    });
  } catch (error) {
    console.error("Report submission failed:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid disaster report details",
      });
    }

    res.status(500).json({
      message: "Failed to submit disaster report",
    });
  }
});

// Update incident status and supervisor response
app.patch("/api/disasters/:id/response", async (req, res) => {
  try {
    const { status, supervisorResponse } = req.body;

    const allowedStatuses = ["Pending", "In Progress", "Resolved"];

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid disaster report ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid incident status",
      });
    }

    if (
      typeof supervisorResponse !== "string" ||
      !supervisorResponse.trim()
    ) {
      return res.status(400).json({
        message: "Please enter a supervisor response",
      });
    }

    const disaster = await Disaster.findByIdAndUpdate(
      req.params.id,
      {
        status,
        supervisorResponse: supervisorResponse.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!disaster) {
      return res.status(404).json({
        message: "Disaster report not found",
      });
    }

    res.status(200).json({
      message: "Incident response updated successfully",
      disaster,
    });
  } catch (error) {
    console.error("Response update failed:", error.message);

    res.status(500).json({
      message: "Failed to update incident response",
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
