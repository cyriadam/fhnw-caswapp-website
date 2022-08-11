/**
 * @module party
 * party management and party list synchronized with clients
 * 
 * Note: this module is generic and indepedant of the game. It could handle different games.
 */

const { sequence, random } = require("../utils/general");
const { Observable, ObservableObject } = require("../utils/observable");
const CustomError = require("../utils/CustomError");
const { createResponse, createMessage } = require("../utils/io-message");
const { Game, GameController } = require("./gameCellife");

const log4js = require("../services/log4j");
let logger = log4js.getLogger("partyCtrl".toFixed(10));
logger.level = "error";

const partyIdSequence = sequence();     // identifier for the party
const playerIdSequence = sequence();    // identifier for the player


/**
 * Create an instance of a party
 * 
 * Note:
 * - Each party has a Game item which contains the specific properties of the game
 * - Each party has his own gameController
 * - Each party has his list of players
 * - A party expired if the game is not started before a given delay
 * - The party info is an ObservableObject type, meaning that it triggers onChange whenever one of his properties is updated
 * - The gameController and the party are sharing the list of players (containing the socket for notification), therefore it is pass to the gameController by reference
 * 
 * @param {number} partyId 
 * @param {number} nbPlayers 
 * @param {String} partyName 
 * @param {String} playerName 
 * @param {Object} hallOfFame - the hallOfFame controller
 * @returns {Object} { id, name, expired(), isStarted(), addPlayer(), info() }
 */
const Party = (partyId, nbPlayers, partyName, playerName, hallOfFame, dataPool) => {

  let timeoutExpiredId;
  const expired = Observable(false);        
  const game = Game(dataPool.getValue("nbPlayerBullets"), dataPool.getValue("nbBombs"), dataPool.getValue("gameDuration"), dataPool.getValue("gameTimeOut"));
  const players = { data: [] };                                                                        // point of interest : pass players by reference
  const gameController = GameController(game, players, hallOfFame, { partyId, partyName, nbPlayers }); // point of interest : pass players by reference
  const info = ObservableObject({
    id: partyId,
    nbPlayers,
    name: partyName,
    createdBy: playerName,
    createdAt: new Date().getTime(),
    players: [],                        // contains the player information (playerId and  playerName)
    status: "open",
  });

  // when the gameController is created a timeOut is created for the expiration, the timer is cancel when the game is started
  gameController.gameStarted.onChange((started) => {
    if (started) {
      clearInterval(timeoutExpiredId);              // cancel the timeOut interval
      info.getObs("status").setValue("closed");     // close the party
    } else {
      timeoutExpiredId = setTimeout(() => expired.setValue(true), game.getTimeoutGame());       // start the timeOut interval
      info.setValue({ players: [], status: "open" });                                           // initialise the party 
    }
  });

  // when the party expired, notify all players
  expired.onChange((expired) => {
    if (expired) {
      players.data.forEach((player) => {
        logger.debug(`emit partyTimeOut(partyId=[${partyId}]) to player ${player.playerName}`);
        player.socket.emit("partyTimeOut", partyId);
      });
    }
  });


  /**
   * Create a new player and add it to the party
   * 
   * Note : 
   * - The player item is created by the gameController as his properties are specific to the game logic
   * - Handle player notification 'leaveParty'
   * - When all players are added to the party, the game is started
   * - Player 'leaveParty' notification is handle on this level (optimisation)
   * @param {*} socket 
   * @param {*} playerName 
   * @returns {number} the playerId
   */
  const addPlayer = (socket, playerName) => {
    // const playerId = playerIdSequence.next().value;              // not strong enough as heroku is restarting the node server every day
    const playerId = playerIdSequence.next().value * Math.pow(10, 3) + random(Math.pow(10, 3));

    // notify all players that a new player join the party
    players.data.forEach((player) => {
      logger.debug("emit message(Player joins Party)");
      player.socket.emit("message", createMessage(`Player ${playerName} joins the party ${partyName}`));
    });

    players.data.push(gameController.createPlayer(socket, playerId, playerName));
    info.getObs("players").setValue([...info.getObs("players").getValue(), { playerId, playerName }]);      // add the player to the party info

    // the client leave the party
    socket.on("leaveParty", (callback) => {
      logger.info(`the player(id=${playerId}) leaves the party(id=${partyId}, name=[${partyName}])`);
      // remove the player from the player list and from the party info
      players.data = players.data.filter((player) => player.playerId != playerId);
      info.getObs("players").setValue([ ...info.getObs("players").getValue().filter((player) => player.playerId != playerId), ]);       // point of interest

      // notify all players that the player lefts the party
      players.data.forEach((player) => {
        logger.debug("emit message(Player lefts Party)");
        player.socket.emit("message", createMessage(`Player ${playerName} lefts the party ${partyName}`));
      });

      if (callback) callback(createResponse());
    });

    // When all players are added to the party, the game is started
    if (players.data.length == nbPlayers) gameController.gameStarted.setValue(true);

    return playerId;
  };

  return {
    id: partyId,
    name: partyName,
    expired,
    isStarted: gameController.gameStarted.getValue,
    addPlayer,
    info,
  };
};


/**
 * PartyController
 * 
 * @param {Object} hallOfFame 
 * @param {Object} dataPool 
 * @returns {Object} { listen }
 */
const PartyController = (hallOfFame, dataPool) => {
  let parties = [];
  const partiesInfo = Observable([]);

  /**
   * Create a partyItem 
   * @param {number} nbPlayers 
   * @param {String} partyName 
   * @param {String} playerName 
   * @returns {number} the partyId
   */
  const newParty = (nbPlayers, partyName, playerName) => {
    const partyId = partyIdSequence.next().value;
    let rmPartyInfoSubscription;

    const party = Party(partyId, nbPlayers, partyName, playerName, hallOfFame, dataPool);

    // add party subscriptions
    party.expired.onChange((expired) => {
      if (expired) {
        // remove the party from the parties list
        logger.info(`party(${party.id}) is Expired`);
        parties = parties.filter((p) => p.id != party.id);
        if (rmPartyInfoSubscription) rmPartyInfoSubscription();
        // update the partiesInfo
        partiesInfo.setValue([...partiesInfo.getValue().filter((a) => a.id != party.id)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)));
      }
    });
    parties.push(party);

    rmPartyInfoSubscription = party.info.onChange((data) => {
      logger.debug(`party updated : ${JSON.stringify(data)} data.players=${JSON.stringify(data.players)}`);
      // update the partiesInfo
      partiesInfo.setValue([data, ...partiesInfo.getValue().filter((a) => a.id != partyId)].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)));
    });

    logger.info(`create party(id=${party.id}, nbPlayers=${nbPlayers}), nb parties=${parties.length}`);
    return partyId;
  };


  /**
   * Add the player to a party
   * 
   * Note: usage of CustomError exception 
   * @param {*} socket 
   * @param {number} partyId 
   * @param {String} playerName 
   * @returns {Object} { playerId, partyName }
   */
  const joinParty = (socket, partyId, playerName) => {
    const party = parties.find((party) => party.id == partyId);

    if (party == undefined) throw new CustomError("ERR_NOTFOUND", `party ${partyId} not defined!`);
    if (party.isStarted()) throw new CustomError("ERR_NOTAVAILABLE", `party ${partyId} already started!`);

    let playerId = party.addPlayer(socket, playerName);
    logger.info(`player(id=${playerId}, name=[${playerName}]) joins party(id=${party.id}, name=[${party.name}])`);

    return { playerId, partyName: party.name };
  };

  /**
   * Register a socket client and listen for 'partiesInfoSubscribe', 'newParty', 'joinParty' and 'disconnect' events
   * 
   * Note: the 'leaveParty' client notification is handle in the party object (more efficient because we don't need to loop through all parties to find the one concerned)
   * @param {*} socket 
   */
  const listen = (socket) => {
    let rmPartiesInfoSubscription;

     // subscribe to partiesInfo change notification
    socket.on("partiesInfoSubscribe", (callback) => {
      logger.info(`WebSocket(id=${socket.id}) send partiesInfoSubscribe()`);
      rmPartiesInfoSubscription = partiesInfo.onChange((value) => {
        if (value != undefined) {
          logger.debug(`emit 'partiesInfo' [${JSON.stringify(value)}]`);
          socket.emit("partiesInfo", value);
        }
      });
      if (callback) callback(createResponse());
    });

    // the client create a new party : we create the party and join the player
    socket.on("newParty", ({ nbPlayers = 2, partyName, playerName }, callback) => {
      logger.info(`WebSocket(id=${socket.id}) send newParty(nbPlayers=${nbPlayers}, partyName=[${partyName}], playerName=[${playerName}])`);
      try {
        let partyId = newParty(nbPlayers, partyName, playerName);
        let { playerId } = joinParty(socket, partyId, playerName);
        if (callback) callback(createResponse({ partyId, playerId }));
      } catch (err) {
        if (callback) callback(createResponse(undefined, err.message));
      }
    });

    // the client join a party
    socket.on("joinParty", ({ partyId, playerName }, callback) => {
      logger.info(`WebSocket(id=${socket.id}) send joinParty(${partyId})`);
      try {
        let { playerId, partyName } = joinParty(socket, partyId, playerName);
        if (callback) callback(createResponse({ playerId, partyName }));
      } catch (err) {
        if (callback) callback(createResponse(undefined, err.message));
      }
    });

    // -- disconnect --
    socket.on("disconnect", () => {
      logger.info(`WebSocket(id=${socket.id}) disconnect... rmPartiesInfoSubscription()`);
      if (rmPartiesInfoSubscription) rmPartiesInfoSubscription();
    });
  };

  return {
    listen,
  };
};

module.exports = { PartyController };
