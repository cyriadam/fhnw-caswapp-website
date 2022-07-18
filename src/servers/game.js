
const { HallOfFameControler } = require("../game/hallOfFame");
const { PartyControler } = require("../game/party");
const { DataPoolController } = require("../game/dataPool");

const log4js = require("../services/log4j");
const { makeObj } = require("../utils/general");
const { Observable } = require("../utils/observable");
let logger = log4js.getLogger("cas-wapp".toFixed(10));
logger.level = "error";

const hallOfFame = HallOfFameControler();
const dataPool = DataPoolController();
const partyControler = PartyControler(hallOfFame, dataPool);

let clientsCount = Observable(0);
clientsCount.onChange(value=>dataPool.setValue(makeObj('clientsCount', value)));

const listen = (socket) => {
    clientsCount.setValue(clientsCount.getValue()+1);

    socket.emit('init');
    hallOfFame.listen(socket);
    dataPool.listen(socket);
    partyControler.listen(socket);

    // -- disconnect --
    socket.on('disconnect', () => clientsCount.setValue(Math.max(clientsCount.getValue()-1, 0)));
}

module.exports = { listen }



