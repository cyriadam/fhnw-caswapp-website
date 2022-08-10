/**
 * @module cellife game server
 */

const { HallOfFameController } = require("../game/hallOfFame");
const { PartyController } = require("../game/party");
const { DataPoolController } = require("../game/dataPool");

const log4js = require("../services/log4j");
const { makeObj } = require("../utils/general");
const { Observable } = require("../utils/observable");
let logger = log4js.getLogger("cas-wapp".toFixed(10));
logger.level = "error";

// instancy the hallOfFame, dataPool and partyController servers
const hallOfFame = HallOfFameController();
const dataPool = DataPoolController();
const partyController = PartyController(hallOfFame, dataPool);

// create a temp var 'clientsCount' in the datapool  
let clientsCount = Observable(0);
clientsCount.onChange((value) => dataPool.setValue(makeObj("clientsCount", value)));

const listen = (socket) => {
  clientsCount.setValue(clientsCount.getValue() + 1);

  socket.emit("init");              // sent the 'init' message to the client
  hallOfFame.listen(socket);        // register the socket to the hallOfFame server
  dataPool.listen(socket);          // register the socket to the dataPool server
  partyController.listen(socket);   // register the socket to the partyController server

  // -- disconnect --
  socket.on("disconnect", () => clientsCount.setValue(Math.max(clientsCount.getValue() - 1, 0)));
};

module.exports = { listen };
