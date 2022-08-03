require("./utils/general");
const { Server } = require("socket.io");
const ping = require("./servers/ping");
const welcome = require("./servers/welcome");
const game = require("./servers/game");

const log4js = require("./services/log4j");
let logger = log4js.getLogger("server".toFixed(10));
logger.level = "error";

const createServer = (httpServer) => {
  const io = new Server(httpServer, {
    /* options */
  });

  io.on("connection", (socket) => {
    logger.info(`New WebSocket(id=${socket.id}) connection (nb connected clients:${io.engine.clientsCount})`);

    welcome.listen(socket);
    ping.listen(socket);
    game.listen(socket);
  });

  io.engine.on("connection_error", (err) => {
    logger.error(`WebSocket connection error`, err);
  });
};

module.exports = { createServer };
