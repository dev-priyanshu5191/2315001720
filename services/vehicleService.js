const axios = require("axios");
const urls = require("../data/urls.json");

async function getVehicles(token) {
  const response = await axios.get(urls.VEHICLES_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.vehicles;
}

module.exports = { getVehicles };