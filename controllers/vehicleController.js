const { getDepots } = require("../services/depotService");
const { getVehicles } = require("../services/vehicleService");
const { optimizeTasks } = require("../services/schedulerService");

async function scheduleVehicles(req, res) {
    try {
        const token = process.env.ACCESS_TOKEN;
        console.log("Token: ", token);
        const depots = await getDepots(token);
        const vehicles = await getVehicles(token);

        const result = depots.map((depot) => {
            const optimized = optimizeTasks(
                vehicles,
                depot.MechanicHours
            );

            return {
                depotId: depot.ID,
                mechanicHours: depot.MechanicHours,
                totalImpact: optimized.totalImpact,
                selectedTasks: optimized.selectedTasks
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.log("FULL ERROR =>", error.response?.data);
        console.log("STATUS =>", error.response?.status);

        res.status(500).json({
            message: error.message
        });
    }
}

module.exports = { scheduleVehicles };