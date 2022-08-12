/**
 * @module gameCellife
 * cellife game engine
 * 
 * Some characteristics:
 * - The Bullets are refilled every 10 seconds
 * - Every 5 seconds the game is faster
 * - The game boundaries is a square of 20x20 units  
 * - Bombs are dropped every 5 seconds by the game engine or by the players
 * - The bonus are : 1*nbPlayers (*) point(s) if the player move to an unexplored position, 5 points every 5 seconds and 50% of the score of the players killed
 * - The players are located in a battlefield. For futur versions, the battlefield could contains special items (traps, walls, ...)
 * 
 * (*) This logic is implemented to not penalize multi-players party (the average score per user should be the same regardless the number of players)
 */

const { Observable, ObservableObject } = require("../utils/observable");
const { random } = require("../utils/general");

const log4js = require("../services/log4j");
let logger = log4js.getLogger("gameCtrl".toFixed(10));
logger.level = "error";

// some constants
const constants = Object.freeze({
  d_up: 1,
  d_right: 2,
  d_down: 3,
  d_left: 4,
  s_alive: 1,
  s_dead: 2,
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
};

// manage collisions
const hasCollision = (playerCoord, coords) => {
  return coords.some((coord) => coord.x == playerCoord.x && coord.y == playerCoord.y);
};

const getCollisionItem = (playerCoord, items) => {
  return items.find((item) => item.coord.x == playerCoord.x && item.coord.y == playerCoord.y);
};

// manage turn move
const turnClockwise = (direction, clockwise) => {
  let directionsClockwise = [constants.d_up, constants.d_right, constants.d_down, constants.d_left, constants.d_up];
  let directionsAntiClockwise = [constants.d_up, constants.d_left, constants.d_down, constants.d_right, constants.d_up];
  return clockwise
    ? directionsClockwise[directionsClockwise.findIndex((elt) => elt == direction) + 1]
    : directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == direction) + 1];
};

/**
 * Create a player Item
 * 
 * Note: 
 * - The initial direction is random
 * - Every player has his own interval to refill the bullets
 * - getValues() retrieves the properties to sent to the client 
 * @param {*} socket 
 * @param {number} playerId 
 * @param {String} playerName 
 * @param {Object} coord { x, y } 
 * @param {number} direction ( d_up|d_right|d_down|d_left )
 * @param {number} state (s_alive|s_dead)
 * @param {number} score 
 * @param {number} nbBullets 
 * @param {number} intervalRefillBullets 
 * @returns {Object} { socket, playerId, playerName, coord, direction, state, incScore, decNbBullets, incNbBullets, dropBomb, getValues }
 */
const Player = (socket, playerId, playerName, coord, direction = 1 + random(4), state = 1, score = 0, nbBullets = 0, intervalRefillBullets) => {
  let _coord = coord;               // the coord of the player
  let _direction = direction;       // the direction of the player
  let _state = state;               // the state of the player
  let _score = score;               // the score of the player
  let _nbBullets = nbBullets;       // the nb of available bullets
  let _dropBomb = false;            // true if the player drop a bomb, evaluated in the nextBoard() method 
  let intervalRefillBulletsId;      // bomb refill interval

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
  const incScore = (value) => {
    _score = Math.max(0, _score+value);         // point of interest
  };

  return {
    socket,
    playerId,
    playerName,
    getCoord: () => _coord,
    setCoord: (coord) => (_coord = coord),
    getDirection: () => _direction,
    setDirection: (direction) => (_direction = direction),
    getState: () => _state,
    setState: (state) => (_state = state),
    getScore: () => _score,
    incScore,
    isDropBomb: () => _dropBomb,
    dropBomb: (state = true) => {
      if (_nbBullets > 0) _dropBomb = state;
    },
    getNbBullets: () => _nbBullets,
    decNbBullets,
    incNbBullets,
    getValues: () => ({ playerId, coord: _coord, direction: _direction, state: _state, score: _score, nbBullets: _nbBullets }),
  };
};

/**
 *  Create a Game item (contains the game properties)
 * 
 * Note:
 * - The intervalRefillBullets is set to 10 seconds
 * - The interval to evaluate the nextboard is initialised to 500ms and get faster every 5 seconds
 * - The game boundaries is a square of 20x20 units  
 * @param {number} [nbPlayerBullets]=3 : number max of bullets per player
 * @param {number} [nbBombs]=10 : number of random bombs added during the party
 * @param {number} [gameDuration]=30 : duration of the party
 * @param {number} [gameTimeOut]=30 : delay before the party expired if all players didn't join
 * @returns {Object} { reset(), faster(), ... } 
 */
const Game = (nbPlayerBullets = 3, nbBombs = 10, gameDuration = 30, gameTimeOut = 30) => {
  logger.debug(`initialise the Game with : nbPlayerBullets=${nbPlayerBullets}, nbBombs=${nbBombs}, gameDuration=${gameDuration}, gameTimeOut=${gameTimeOut} `);

  let gameStart = 3;                    // the game start 3 seconds after the party is looked
  let intervalBomb = 5;                 // a new bomb is drop by the game engine every 5 seconds 
  let intervalRefillBullets = 10;       // interval to refill the bullets
  let intervalNextBoard = 500;          // nextboard interval
  let boundaries = { x: 20, y: 20 };    // boundaries of the game
  // bonus properties
  const bonus = Object.freeze({ move: 1, time: 5, bomb: 0.5 }); // bonus bomb is 50 % of the score of the player score
  // battelField were all players are located
  let battelField = Array.from({ length: boundaries.x }, (v, i) => Array.from({ length: boundaries.y }, (v, i) => bonus.move));

  return {
    getTimeoutStartGame: () => gameStart * 1000,
    getTimeoutGame: () => gameTimeOut * 1000,
    getIntervalBomb: () => intervalBomb * 1000,
    getIntervalGame: () => gameDuration * 1000,
    getIntervalNextBoard: () => intervalNextBoard,
    getIntervalFaster: () => 5 * 1000,
    getIntervalRefillBullets: () => intervalRefillBullets * 1000,
    getNbBombs: () => nbBombs,
    getBoundaries: () => boundaries,
    reset: () => {
      intervalNextBoard = 500;
      battelField.forEach((col) => col.fill(bonus.move));
    },
    faster: () => {
      if ((intervalNextBoard *= 0.5) < 100) intervalNextBoard = 100;
    },
    battelField,
    getBonus: () => bonus,
    getNbPlayerBullets: () => nbPlayerBullets,
  };
};

/**
 * GameController and Game engine
 * 
 * @param {Object} game : the game properties
 * @param {Object} players : list of players
 * @param {*} hallOfFame : hallOfFame controller
 * @param {*} partyData : party properties
 * @returns {Object} { gameStarted(), createPlayer() }
 */
const GameController = (game, players, hallOfFame, partyData) => {
  let intervalBombId;           // interval to drop a new bomb
  let timeoutGameId;            // timeout interval
  let intervalNexBordId;        // interval to evaluate the nextBoard
  let intervalFasterId;         // interval to speed up the game
  let intervalTimerId;          // interval to notify gameData
  let rmGameDataSubscription;

  const gameData = ObservableObject({ ...partyData, timer: game.getIntervalGame() / 1000, cover: 100 });
  const gameStarted = Observable(false);
  const nextBoardTimer = Observable(0);
  let nbBombs;
  let bombs = [];

  /**
   * The whole Game Logic
   */
  const nextBoard = () => {
    players.data.forEach((player) => {
      if (player.getState() == constants.s_dead) return;    // ignore dead players

      // move in boundaries
      const playerCoords = { ...player.getCoord() };                                                            // point of interest : shadow copy
      const playersCoords = players.data.map((p) => ({ playerId: p.playerId, coord: { ...p.getCoord() } }));    // point of interest : shadow copy
      player.setCoord(keepInBoundaries(move(player.getCoord(), player.getDirection()), game.getBoundaries()));

      // collision with bombs detection
      let collisionBomb = getCollisionItem(player.getCoord(), bombs);
      if (collisionBomb) {
          logger.debug(`collision(playerId=[${player.playerId}]) with bomb`);
          player.setState(constants.s_dead);
          // bonus for the owner of the bomb
          if (collisionBomb.owner != -1 && collisionBomb.owner != player.playerId) {
            const bonus = Math.floor(player.getScore() * game.getBonus().bomb);
            players.data.find((p) => p.playerId == collisionBomb.owner).incScore(bonus);
            player.incScore(-bonus);
        }
        return;
      }

      // collision with players detection
      let collisionPlayer = getCollisionItem(player.getCoord(), playersCoords);
      if (collisionPlayer) {
        logger.debug(`collision(playerId=[${player.playerId}]) with other player(${collisionPlayer.playerId})`);
        players.data.filter((p) => p.getCoord().x == player.getCoord().x && p.getCoord().y == player.getCoord().y).forEach((p) => p.setState(constants.s_dead));
        return;
      }

      // player action : warning : the player must move BEFORE dropping a bomb
      if (player.isDropBomb()) {
        player.decNbBullets();
        const bomb = { coord: { x: playerCoords.x, y: playerCoords.y }, owner: player.playerId };
        bombs.push(bomb);
        players.data.forEach((player) => {
          logger.debug(`emit 'bomb' to player ${player.playerName}`);
          player.socket.emit("bomb", bomb.coord);
        });
      }

      // increment score if the player move to an unexplored position
      if (game.battelField[player.getCoord().x][player.getCoord().y] != 0) {
        player.incScore(game.battelField[player.getCoord().x][player.getCoord().y]*players.data.length);
        game.battelField[player.getCoord().x][player.getCoord().y] = 0;
      }
    });
  };

  // drop a bomb and notify all players
  const dropBomb = (boundaries) => {
    // drop a random bomb
    if (nbBombs-- > 0) {
      const bomb = { coord: { x: random(boundaries.x), y: random(boundaries.y) }, owner: -1 };
      bombs.push(bomb);
      players.data.forEach((player) => {
        logger.debug(`emit 'bomb' to player ${player.playerName}`);
        player.socket.emit("bomb", bomb.coord);
      });
    } else {
      clearInterval(intervalBombId);
    }
  };

  // evaluate the nextBoard on time interval 
  nextBoardTimer.onChange((now) => {
    if (now > 0) {
      nextBoard();
      const playersData = players.data.map((player) => player.getValues());
      players.data.forEach((player) => {
        logger.debug(`emit 'nextBoard' to player ${player.playerName}`);
        player.socket.emit("nextBoard", playersData);
      });
      // stop the game if all players are dead
      if (!players.data.some((player) => player.getState() == constants.s_alive)) gameStarted.setValue(false);
    }
  });

  /**
   * Initialise and start the game 
   */
  const initGame = () => {
    // init the game
    const playersData = players.data.map((player) => player.getValues());

    players.data.forEach((player) => {
      // register the player events : playerTurn & playerDropBomb
      player.socket.on("playerTurn", ({ clockwise }, callback) => {
        player.setDirection(turnClockwise(player.getDirection(), clockwise));
        if (callback) callback();
      });
      player.socket.on("playerDropBomb", (callback) => {
        player.dropBomb();
        if (callback) callback();
      });

      // sent gameStarted to all players
      logger.debug(`emit 'gameStarted' to player ${player.playerName}`);
      player.socket.emit("gameStarted", playersData);
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
      players.data.forEach((player) => {
        if (player.getState() == constants.s_alive) player.incScore(game.getBonus().time);
      });
    }, game.getIntervalFaster());

    intervalTimerId = setInterval(() => gameData.getObs("timer").setValue(gameData.getObs("timer").getValue() - 1), 1000);
  };

  /**
   * Reset the game
   */
  const resetGame = () => {
    // reset the game
    players.data.forEach((player) => {
      // remove the player events listerners : playerTurn, playerDropBomb & leaveParty
      player.socket.removeAllListeners("playerTurn");
      player.socket.removeAllListeners("playerDropBomb");
      player.socket.removeAllListeners("leaveParty");
      // send gameOver 
      logger.debug(`emit 'gameOver' to player ${player.playerName}`);
      // note: add 500ms delay so the client didn't received all end-of-game events in the same moment
      if (hallOfFame.isHighScore(player.getScore())) {
        hallOfFame.addHighScore(player.playerId, player.playerName, player.getScore());
        setTimeout(() => player.socket.emit("gameOver", { highScore: true }), 500);         
      } else setTimeout(() => player.socket.emit("gameOver", { highScore: false }), 500);
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
  };
  
  // handle to start of end of the game
  gameStarted.onChange((started) => {
    logger.debug(`gameStarted.onChange(${started})`);
    if (started) {
      players.data.forEach((player) => {
        logger.debug(`emit partyLocked(partyId=[${partyData.partyId}]) to player ${player.playerName}`);
        player.socket.emit("partyLocked", partyData.partyId);
      });
      gameData.getObs("timer").setValue(game.getIntervalGame() / 1000);
      setTimeout(initGame, game.getTimeoutStartGame());
      rmGameDataSubscription = gameData.onChange((data) => {
        players.data.forEach((player) => {
          logger.debug(`emit 'gameData' to player ${player.playerName}`);
          player.socket.emit("gameData", data);
        });
      });
    } else {
      resetGame();
      if (rmGameDataSubscription) rmGameDataSubscription();
    }
  });

  return {
    gameStarted,
    createPlayer: (socket, playerId, playerName) =>
      Player(
        socket,
        playerId,
        playerName,
        { x: random(game.getBoundaries().x), y: random(game.getBoundaries().y) },
        undefined,
        undefined,
        undefined,
        game.getNbPlayerBullets(),
        game.getIntervalRefillBullets()
      ),
  };
};

module.exports = { Game, GameController };
