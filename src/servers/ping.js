const log4js = require("../services/log4j");
let logger = log4js.getLogger("cas-wapp".toFixed(10));
logger.level = "error";

const listen = (socket) => {
  socket.on("ping", ({ time }, callback) => {
    logger.info(`WebSocket(id=${socket.id}) send ping(time=${time})`);
    const now = new Date().getTime();
    if (!time || time > now) return callback("Invalid request!");

    logger.debug("emit pong");
    socket.emit("pong", { time });
    if (callback) callback();
  });
};

module.exports = { listen };
