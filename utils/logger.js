const axios = require("axios");

async function Log(stack, level, packageName, message) {

    console.log("TOKEN =>", process.env.ACCESS_TOKEN);

    try {

        const response = await axios.post(
            "http://4.224.186.213/evaluation-service/logs",
            {
                stack,
                level,
                package: packageName,
                message
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
                }
            }
        );

        console.log(response.data);

    } catch (error) {

        console.log(error.response?.data);
        console.log(error.response?.status);

    }
}

module.exports = Log;