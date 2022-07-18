const { sequence, random } = require("../utils/general");
const { Observable, ObservableObject } = require("../utils/observable");
const CustomError = require("../utils/CustomError");
const { createResponse, createMessage } = require("../utils/io-message");
const { Game, GameControler } = require("./game");

const log4js = require("../services/log4j");
let logger = log4js.getLogger("partyCtrl".toFixed(10));
// logger.level = "debug";

const partyIdSequence = sequence();
const playerIdSequence = sequence();
let dataPool;

const Party = (partyId, nbPlayers, partyName, playerName, hallOfFame) => {

    let timeoutExpiredId;
    const expired = Observable(false);
    const game = Game(dataPool.getValue('nbPlayerBullets'), dataPool.getValue('nbBombs'), dataPool.getValue('gameDuration'), dataPool.getValue('gameTimeOut'));
    const players = { data: [] };
    const gameControler = GameControler(game, players, hallOfFame, {partyName, nbPlayers}); // pass players by reference
    const info = ObservableObject({id:partyId, nbPlayers, name:partyName, createdBy:playerName, createdAt: new Date().getTime(), players:[], status:'open'});

    gameControler.gameStarted.onChange((started) => {
        if (started) {
            clearInterval(timeoutExpiredId);
            info.getObs('status').setValue('closed');
        }
        else {
            timeoutExpiredId = setTimeout(() => expired.setValue(true), game.getTimeoutGame());
            info.setValue({players:[], status:'open'});
            // info.getObs('status').setValue('open');
        }
    });

    expired.onChange((expired) => {
        if (expired) {
            players.data.forEach((player) => {
                logger.debug(`emit 'partyTimeOut' to player ${player.playerName}`);
                player.socket.emit("partyTimeOut");
            });
        }
    });

    const addPlayer = (socket, playerName) => {
        // const playerId = playerIdSequence.next().value;
        const playerId = playerIdSequence.next().value*Math.pow(10, 3)+random(Math.pow(10, 3));

        players.data.forEach((player) => {
            logger.debug("emit message(Player joins Party)");
            player.socket.emit("message", createMessage(`Player ${playerName} joins the party ${partyName}`));
        });

        players.data.push(gameControler.createPlayer(socket, playerId, playerName));
        info.getObs('players').setValue([...info.getObs('players').getValue(), {playerId, playerName}]);

        socket.on("leaveParty", (callback) => {
            logger.info(`the player(id=${playerId}) leaves the party(id=${partyId}, name=[${partyName}])`);
            players.data = players.data.filter((player) => player.playerId != playerId);
            info.getObs('players').setValue([...info.getObs('players').getValue().filter(player=>player.playerId!=playerId)]);

            players.data.forEach((player) => {
                logger.debug("emit message(Player lefts Party)");
                player.socket.emit("message", createMessage(`Player ${playerName} lefts the party ${partyName}`));
            });

            if (callback) callback(createResponse());
        });

        if (players.data.length == nbPlayers) gameControler.gameStarted.setValue(true); 

        return playerId;
    };

    return {
        id: partyId,
        name: partyName,
        expired,
        isStarted: gameControler.gameStarted.getValue,
        addPlayer,
        info,
    };
};

const PartyControler = (hallOfFame, dataPoolInstance) => {

    let parties = [];
    const partiesInfo = Observable([]);

    dataPool=dataPoolInstance;

    const newParty = (nbPlayers, partyName, playerName) => {
        const partyId = partyIdSequence.next().value;
        let rmPartyInfoSubscription;

        const party = Party(partyId, nbPlayers, partyName, playerName, hallOfFame);
        // add party subscriptions
        party.expired.onChange((expired) => {
            if (expired) {
                // remove the party from the parties list
                logger.info(`party(${party.id}) is Expired`);
                parties = parties.filter((p) => p.id != party.id);
                if(rmPartyInfoSubscription) rmPartyInfoSubscription();
                partiesInfo.setValue([...partiesInfo.getValue().filter(a=>a.id!=party.id)].sort((a, b) => a.createdAt > b.createdAt ? -1 : 1));
            }
        });
        parties.push(party);
        rmPartyInfoSubscription=party.info.onChange(data=>{
            console.log(`party updated : ${JSON.stringify(data)} data.players=${JSON.stringify(data.players)}`);
            partiesInfo.setValue([data, ...partiesInfo.getValue().filter(a=>a.id!=partyId)].sort((a, b) => a.createdAt > b.createdAt ? -1 : 1));
        });

        logger.info(`create party(id=${party.id}, nbPlayers=${nbPlayers}), nb parties=${parties.length}`);
        return partyId;
    };

    const joinParty = (socket, partyId, playerName) => {
        const party = parties.find((party) => party.id == partyId);

        if (party == undefined) throw new CustomError("ERR_NOTFOUND", `party ${partyId} not defined!`);
        if (party.isStarted()) throw new CustomError("ERR_NOTAVAILABLE", `party ${partyId} already started!`);

        let playerId = party.addPlayer(socket, playerName);
        logger.info(`player(id=${playerId}, name=[${playerName}]) joins party(id=${party.id}, name=[${party.name}])`);

        return playerId;
    };

    const listen = (socket) => {
        let rmPartiesInfoSubscription;

        socket.on('partiesInfoSubscribe', (callback) => {
            logger.info(`WebSocket(id=${socket.id}) send partiesInfoSubscribe()`);
            rmPartiesInfoSubscription = partiesInfo.onChange(value => {
                if (value!=undefined) {
                    logger.debug(`emit 'partiesInfo' [${JSON.stringify(value)}]`);
                    socket.emit('partiesInfo', value);
                }
            });
            if (callback) callback(createResponse());
        });

        socket.on('newParty', ({nbPlayers=2, partyName, playerName}, callback) => {
            logger.info(`WebSocket(id=${socket.id}) send newParty(nbPlayers=${nbPlayers}, partyName=[${partyName}], playerName=[${playerName}])`); 
            try {
                let partyId = newParty(nbPlayers, partyName, playerName);      
                let playerId = joinParty(socket, partyId, playerName);
                if(callback) callback(createResponse({partyId, playerId}));       
            } catch(err) {
                if(callback) callback(createResponse(undefined, err.message));       
            }
        });
    
        socket.on('joinParty', ({partyId, playerName}, callback) => {
            logger.info(`WebSocket(id=${socket.id}) send joinParty(${partyId})`); 
            try {
                let playerId = joinParty(socket, partyId, playerName);          
                if(callback) callback(createResponse({playerId}));    
            } catch(err) {
                if(callback) callback(createResponse(undefined, err.message));   
            }
        });

        // -- disconnect --
        socket.on('disconnect', () => {
            logger.info(`WebSocket(id=${socket.id}) disconnect... rmPartiesInfoSubscription()`);
            if(rmPartiesInfoSubscription) rmPartiesInfoSubscription();
        })
    }

    return {
        listen
    }

};

module.exports = { PartyControler };
