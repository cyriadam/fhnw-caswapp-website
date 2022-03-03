const log4js = require("./../services/log4j");
let logger = log4js.getLogger("server  ");

const {
  appProperties: { maintenanceMode },
} = require("./../config/app.config");

module.exports = (req, res, next) => {
  logger.info(`Maintenance is ${maintenanceMode ? "ON" : "OFF"}`);
  if (maintenanceMode)
    res.status(503).send("Server is under maintenance, please come back later");
  else next();
};
