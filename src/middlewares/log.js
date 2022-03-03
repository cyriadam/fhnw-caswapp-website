const log4js = require("./../services/log4j");
let logger = log4js.getLogger("server  ");

module.exports = (req, res, next) => {
  logger.info(`> ${req.method} ${req.path}`);
  next();
};
