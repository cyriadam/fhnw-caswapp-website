const { Observable, ObservableObject } = require("../utils/observable");
const { random } = require("../utils/general");

const log4js = require("../services/log4j");
let logger = log4js.getLogger("gameCtrl".toFixed(10));
logger.level = "error";

const constants = Object.freeze({
    "d_up": 1,
    "d_right": 2,
    "d_down": 3,
    "d_left": 4,
    "s_alive": 1,
    "s_dead": 2
});

// manage move
const move = (coord, direction) => {
    if (direction == constants.d_up) coord.y--;
    else if (direction == constants.d_right) coord.x++;
    else if (direction == constants.d_down) coord.y++;
    else coord.x--;
    return coord;
};

// manage game boundaries
const keepInBoundaries = (coord, boundaries) => {
    if (coord.x < 0) coord.x = boundaries.x - 1;
    else if (coord.x >= boundaries.x) coord.x = 0;
    if (coord.y < 0) coord.y = boundaries.y - 1;
    else if (coord.y >= boundaries.y) coord.y = 0;
    return coord;
}

// manage collisions
const hasCollision = (playerCoord, coords) => {
    return coords.some(coord => (coord.x == playerCoord.x) && (coord.y == playerCoord.y));
}

const getCollisionItem = (playerCoord, items) => {
    return items.find(item => (item.coord.x == playerCoord.x) && (item.coord.y == playerCoord.y));
}

// manage turn move
const turnClockwise = (direction, clockwise) => {
    let directionsClockwise = [constants.d_up, constants.d_right, constants.d_down, constants.d_left, constants.d_up];
    let directionsAntiClockwise = [constants.d_up, constants.d_left, constants.d_down, constants.d_right, constants.d_up];
    return clockwise ? (directionsClockwise[directionsClockwise.findIndex((elt) => elt == direction) + 1])
        : (directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == direction) + 1]);
};


const Player = (socket, playerId, playerName, coord, direction = (1 + random(4)), state = 1, score = 0, nbBullets = 0, intervalRefillBullets) => {
    let _coord = coord;
    let _direction = direction;
    let _state = state;
    let _score = score;
    let _nbBullets = nbBullets;
    let _dropBomb = false;
    let intervalRefillBulletsId;

    const decNbBullets = () => {
        if (_nbBullets > 0) {
            _nbBullets--;
            _dropBomb = false;
            if (!intervalRefillBulletsId) intervalRefillBulletsId = setInterval(incNbBullets, intervalRefillBullets);
        }
    };
    const incNbBullets = () => {
        if (_nbBullets < nbBullets) _nbBullets++;
        if (_nbBullets == nbBullets) intervalRefillBulletsId = clearInterval(intervalRefillBulletsId);
    };
    const incScore = value => { _score += value; };

    return {
        socket,
        playerId,
        playerName,
        getCoord: () => _coord,
        setCoord: coord => _coord = coord,
        getDirection: () => _direction,
        setDirection: direction => _direction = direction,
        getState: () => _state,
        setState: state => _state = state,
        getScore: () => _score,
        incScore,
        isDropBomb: () => _dropBomb,
        dropBomb: (state = true) => { if (_nbBullets > 0) _dropBomb = state },
        getNbBullets: () => _nbBullets,
        decNbBullets,
        incNbBullets,
        getValues: () => ({ playerId, coord: _coord, direction: _direction, state: _state, score: _score, nbBullets: _nbBullets }),
    }
};

const Game = (nbPlayerBullets=3, nbBombs=10, gameDuration=30, gameTimeOut=30) => {
    logger.debug(`initialise the Game with : nbPlayerBullets=${nbPlayerBullets}, nbBombs=${nbBombs}, gameDuration=${gameDuration}, gameTimeOut=${gameTimeOut} `)
    let intervalBomb = 5;
    let intervalRefillBullets = 10;
    let intervalNextBoard = 500;
    let boundaries = { x: 20, y: 20 };
    const bonus = Object.freeze({ "move": 1, "time": 5, "bomb": 0.5 });        // bonus bomb is 50 % of the score of the player score

    let battelField = Array.from({ length: boundaries.x }, (v, i) => (Array.from({ length: boundaries.y }, (v, i) => bonus.move)));

    return {
        getTimeoutStartGame: () => 3 * 1000,
        getTimeoutGame: () => gameTimeOut * 1000,
        getIntervalBomb: () => intervalBomb * 1000,
        getIntervalGame: () => gameDuration * 1000,
        getIntervalNextBoard: () => intervalNextBoard,
        getIntervalFaster: () => 5 * 1000,
        getIntervalRefillBullets: () => intervalRefillBullets * 1000,
        getNbBombs: () => nbBombs,
        getBoundaries: () => boundaries,
        reset: () => { intervalNextBoard = 500; battelField.forEach(col => col.fill(bonus.move)); },
        faster: () => { if ((intervalNextBoard *= 0.5) < 100) intervalNextBoard = 100; },
        battelField,
        getBonus: () => bonus,
        getNbPlayerBullets: () => nbPlayerBullets,
    }
};

const GameControler = (game, players, hallOfFame, partyData) => {
    let intervalBombId;
    let timeoutGameId;
    let intervalNexBordId;
    let intervalFasterId;
    let rmGameDataSubscription;
    let intervalTimerId;

    const gameData = ObservableObject({...partyData, timer:game.getIntervalGame()/1000, cover:100});
    const gameStarted = Observable(false);
    const nextBoardTimer = Observable(0);
    let nbBombs;
    let bombs = [];

    const nextBoard = () => {
        players.data.forEach(player => {
            if (player.getState() == constants.s_dead) return;

            // move in boundaries
            const playerCoords = ({ ...player.getCoord() });
            const playersCoords = players.data.map(p => ({ playerId: p.playerId, coord: { ...p.getCoord() } }));  // shadow copy 
            player.setCoord(keepInBoundaries(move(player.getCoord(), player.getDirection()), game.getBoundaries()));

            // collision with bombs detection
            let collisionBomb = getCollisionItem(player.getCoord(), bombs);
            if (collisionBomb) {
                logger.debug(`collision(playerId=[${player.playerId}]) with bomb`);
                player.setState(constants.s_dead);
                // bonus for the owner of the bomb
                if ((collisionBomb.owner != -1) && (collisionBomb.owner != player.playerId)) players.data.find(p => p.playerId == collisionBomb.owner).incScore(Math.floor(player.getScore() * game.getBonus().bomb));
                return;
            }

            // collision with players detection
            let collisionPlayer = getCollisionItem(player.getCoord(), playersCoords);
            if (collisionPlayer) {
                logger.debug(`collision(playerId=[${player.playerId}]) with other player(${collisionPlayer.playerId})`);
                players.data.filter(p => (p.getCoord().x == player.getCoord().x) && (p.getCoord().y == player.getCoord().y)).forEach(p => p.setState(constants.s_dead));
                return;
            }

            // player action
            if (player.isDropBomb()) {
                player.decNbBullets();
                // a factoriser  <-------
                const bomb = { coord: { x: playerCoords.x, y: playerCoords.y }, owner: player.playerId };
                bombs.push(bomb);
                players.data.forEach(player => {
                    logger.debug(`emit 'bomb' to player ${player.playerName}`);
                    player.socket.emit('bomb', bomb.coord);
                });
            }

            // increment score
            if (game.battelField[player.getCoord().x][player.getCoord().y] != 0) {
                player.incScore(game.battelField[player.getCoord().x][player.getCoord().y]);
                game.battelField[player.getCoord().x][player.getCoord().y] = 0;
            };
        });
    };

    const dropBomb = (boundaries) => {
        // drop a random bomb
        if ((nbBombs--) > 0) {
            const bomb = { coord: { x: random(boundaries.x), y: random(boundaries.y) }, owner: -1 };
            bombs.push(bomb);
            players.data.forEach(player => {
                logger.debug(`emit 'bomb' to player ${player.playerName}`);
                player.socket.emit('bomb', bomb.coord);
            });
        } else {
            clearInterval(intervalBombId);
        }
    }

    nextBoardTimer.onChange(now => {
        if (now > 0) {
            nextBoard();
            const playersData = players.data.map(player => player.getValues());
            players.data.forEach(player => {
                logger.debug(`emit 'nextBoard' to player ${player.playerName}`);
                player.socket.emit('nextBoard', playersData);
            });
            // stop the game if all players are dead
            if (!players.data.some(player => player.getState() == constants.s_alive)) gameStarted.setValue(false);
        }
    });

    const initGame = () => {
        // init the game
        const playersData = players.data.map(player => player.getValues());
        players.data.forEach(player => {
            // register the player events
            player.socket.on('playerTurn', ({ clockwise }, callback) => {
                player.setDirection(turnClockwise(player.getDirection(), clockwise));
                if (callback) callback();
            });
            player.socket.on('playerDropBomb', (callback) => {
                player.dropBomb();
                if (callback) callback();
            });
            // sent gameStarted to all players
            logger.debug(`emit 'gameStarted' to player ${player.playerName}`);
            player.socket.emit('gameStarted', playersData);
        });
        nbBombs = game.getNbBombs();
        // initialise the intervals 
        intervalBombId = setInterval(() => dropBomb(game.getBoundaries()), game.getIntervalBomb());
        timeoutGameId = setTimeout(() => gameStarted.setValue(false), game.getIntervalGame());
        intervalNexBordId = setInterval(() => nextBoardTimer.setValue(Date.now()), game.getIntervalNextBoard());
        intervalFasterId = setInterval(() => {
            game.faster();
            clearInterval(intervalNexBordId);
            intervalNexBordId = setInterval(() => nextBoardTimer.setValue(Date.now()), game.getIntervalNextBoard());
            // bonus for players
            players.data.forEach(player => { if (player.getState() == constants.s_alive) player.incScore(game.getBonus().time); });
        }, game.getIntervalFaster());
        intervalTimerId = setInterval(() => gameData.getObs('timer').setValue(gameData.getObs('timer').getValue()-1), 1000);
    }

    const resetGame = () => {
        // reset the game
        players.data.forEach(player => {
            // remove the player events listerners
            player.socket.removeAllListeners("playerTurn");
            player.socket.removeAllListeners("playerDropBomb");
            player.socket.removeAllListeners("leaveParty");
            // send gameOver to all players
            logger.debug(`emit 'gameOver' to player ${player.playerName}`);
            if (hallOfFame.isHighScore(player.getScore())) {
                hallOfFame.addHighScore(player.playerId, player.playerName, player.getScore());
                setTimeout(() => player.socket.emit('gameOver', { highScore: true }), 500);
            } else setTimeout(() => player.socket.emit('gameOver', { highScore: false }), 500);
        });
        players.data = [];
        bombs = [];
        game.reset();
        // reset the intervals 
        clearInterval(intervalBombId);
        clearTimeout(timeoutGameId);
        clearInterval(intervalNexBordId);
        clearInterval(intervalFasterId);
        clearInterval(intervalTimerId);
    }

    gameStarted.onChange(started => {
        logger.debug(`gameStarted.onChange(${started})`);
        if (started) {
            players.data.forEach((player) => {
                logger.debug(`emit partyLocked(partyId=[${partyData.partyId}]) to player ${player.playerName}`);
                player.socket.emit("partyLocked", partyData.partyId);  
            });
            gameData.getObs('timer').setValue(game.getIntervalGame()/1000);
            setTimeout(initGame, game.getTimeoutStartGame());
            rmGameDataSubscription =  gameData.onChange(data=>{
                players.data.forEach((player) => {
                    logger.debug(`emit 'gameData' to player ${player.playerName}`);
                    player.socket.emit("gameData", data);
                });
            })
        }
        else {
            resetGame();
            if(rmGameDataSubscription) rmGameDataSubscription();
        }
    });

    return {
        gameStarted,
        createPlayer: (socket, playerId, playerName) => Player(socket, playerId, playerName, { x: random(game.getBoundaries().x), y: random(game.getBoundaries().y) }, undefined, undefined, undefined, game.getNbPlayerBullets(), game.getIntervalRefillBullets()),
    }
}

module.exports = { Game, GameControler } 
