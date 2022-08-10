/**
 * @module welcome server
 * emit a 'welcome' message on client connexion
 */

const { createMessage } = require("../utils/io-message");
const log4js = require("../services/log4j");
let logger = log4js.getLogger("cas-wapp".toFixed(10));
logger.level = "error";

const listen = (socket) => {
  logger.debug("emit message(Welcome)");
  socket.emit("message", createMessage("Welcome"));
};

module.exports = { listen };
