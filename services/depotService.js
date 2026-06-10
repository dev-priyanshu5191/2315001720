const axios = require("axios");
const urls = require("../data/urls.json");

async function getDepots(token) {

    console.log("DEPOT TOKEN =>", token);

    const response = await axios.get(
        urls.DEPOTS_URL,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data.depots;
}
module.exports = { getDepots };