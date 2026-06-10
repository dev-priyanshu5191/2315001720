const express = require("express");
const router = express.Router();

const {
  scheduleVehicles
} = require("../controllers/vehicleController");

router.get("/schedule", scheduleVehicles);

module.exports = router;