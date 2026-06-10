const Log = require("../utils/logger");

const loggingMiddleware = async (req, res, next) => {

    await Log(
        "backend",
        "info",
        "middleware",
        `${req.method} ${req.originalUrl}`,
        process.env.ACCESS_TOKEN
    );

    next();
};

module.exports = loggingMiddleware;