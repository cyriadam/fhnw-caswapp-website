/**
 * @module hallOfFame
 * hallOfFame list synchronized with clients
 */

const fs = require("fs").promises;
const path = require("path");
const { createResponse } = require("../utils/io-message");
const { appProperties: { filePersistenceFolder }, gameProperties: { hallOfFameFileName, hallOfFameNbRecords, hallOfFameExpiredDelay = -1 }, } = require("../config/app.config");
const { Observable } = require("../utils/observable");

const log4js = require("../services/log4j");
const logger = log4js.getLogger("hallOfFame".toFixed(10));
const OneDay = 24 * 60 * 60 * 1000;
logger.level = "error";


/**
 * HallOfFameController
 * 
 * Note: the data are persist on change
 * @returns {Object}  { isHighScore(), addHighScore(), listen() }
 */
const HallOfFameController = () => {
  const hallOfFame = Observable([]);

  // the filler contains the default values 
  const filler = Array.from({ length: hallOfFameNbRecords }, (v, i) => ({ playerId: -1, playerName: "noname", score: 20, comment: "", createdAt: -1 }));

  /**
   * cleanScores remove expired scores and fill/remove entries to keep the defined length
   * @param {Array} scores 
   * @returns {Array}
   */
  const cleanScores = (scores) => {
    let now = new Date().getTime();
    [...scores]
      .filter((a) => a.createdAt > 0 && now - a.createdAt > hallOfFameExpiredDelay * OneDay)
      .forEach((score) => logger.info(`remove expired score of ${score.playerName} from hallOfFame`));
    return [...scores, ...filler]
      .filter((a) => a.createdAt < 0 || hallOfFameExpiredDelay <= 0 || now - a.createdAt < hallOfFameExpiredDelay * OneDay)
      .sort((a, b) => (a.score > b.score ? -1 : 1))
      .slice(0, hallOfFameNbRecords);
  };

  /**
   * loadHallOfFame load the hallOfFame data (read from file)
   * 
   * Note: the format of the file is checked on load
   */
  const loadHallOfFame = async () => {
    logger.info(`load HallOfFame`);

    let scores = [];
    try {
      // rem : use __dirname instead of __basedir due to heroku settings
      // const data = await fs.readFile(path.join(__basedir, filePersistenceFolder, hallOfFameFileName), "utf-8");
      const data = await fs.readFile(path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName), "utf-8");
      logger.debug(`read file ${path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName)} : [${JSON.stringify(data)}]`);
      // check that every item contains the mandatory keys (playerId, playerName, score, comment, createdAt) and remove others
      scores = JSON.parse(data)
        .filter((obj) =>
          Object.keys({ playerId: -1, playerName: "", score: 0, comment: "", createdAt: -1 }).every((key) => obj.hasOwnProperty(key) && obj[key] != undefined)  // point of interest
        )
        .map(({ playerId, playerName, score, comment, createdAt }) => ({ playerId, playerName, score, comment, createdAt }));   // point of interest
    } catch (err) {
      logger.error(`Error while readding the ${hallOfFameFileName} file : ${err}`);
    }
    scores = cleanScores(scores);
    logger.info(`loadHallOfFame : ${JSON.stringify(scores)}`);

    hallOfFame.setValue(scores);
    hallOfFame.onChange(persistHallOfFame);
  };

  /**
   * persistence of the scores
   * @param {Array} scores 
   * @param {Array} oldScores 
   * @returns 
   */
  const persistHallOfFame = async (scores, oldScores) => {
    if (scores == oldScores) return;
    logger.info(`persist HallOfFame : ${JSON.stringify(scores)}`);

    try {
      // await fs.writeFile(path.join(__basedir, filePersistenceFolder, hallOfFameFileName), JSON.stringify(scores));
      await fs.writeFile(path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName), JSON.stringify(scores));
    } catch (err) {
      logger.error(`Error while writting the ${hallOfFameFileName} file : ${err}`);
    }
  };

  /**
   * check if a score is a high score
   * @param {number} score 
   * @returns {boolean}
   */
  const isHighScore = (score) => hallOfFame.getValue().some((item) => item.score < score);

  /**
   * add a new entry in the hallOfFame
   * @param {number} playerId 
   * @param {String} playerName 
   * @param {number} score 
   */
  const addHighScore = (playerId, playerName, score) => {
    let scores = hallOfFame.getValue();
    scores.push({ playerId, playerName, score, comment: "", createdAt: new Date().getTime() });
    scores = cleanScores(scores);
    hallOfFame.setValue(scores);
  };

  /**
   * Register a socket client and listen for 'hofSubscribe', 'hofReset', 'hofAddComment' and 'disconnect' events
   * @param {*} socket 
   */
  const listen = (socket) => {
    let rmHofSubscription;

    // subscribe to hallOfFame change notification
    socket.on("hofSubscribe", (callback) => {
      logger.info(`WebSocket(id=${socket.id}) send hofSubscribe()`);
      rmHofSubscription = hallOfFame.onChange((value) => {
        if (value.length) {
          logger.debug("emit hallOfFame");
          socket.emit("hallOfFame", value);
        }
      });
      if (callback) callback(createResponse());
    });

    // the client reset the hallOfFame
    socket.on("hofReset", (callback) => {
      logger.info(`WebSocket(id=${socket.id}) send hofReset()`);
      hallOfFame.setValue([...filler]);
      if (callback) callback(createResponse());
    });

    // the client update the comment for a given player
    socket.on("hofAddComment", ({ playerId, comment }, callback) => {
      logger.info(`WebSocket(id=${socket.id}) playerId(${playerId}) send hofAddComment('${comment}')`);
      let scores = hallOfFame.getValue();
      (scores.find((score) => score.playerId == playerId) || { comment }).comment = comment;        // point of interest : create a dummy object to avoid error if no found 
      hallOfFame.setValue([...scores]);
      if (callback) callback(createResponse());
    });

    // -- disconnect --
    socket.on("disconnect", () => {
      logger.info(`WebSocket(id=${socket.id}) disconnect... rmHofSubscription()`);
      if (rmHofSubscription) rmHofSubscription();
    });
  };

  loadHallOfFame();

  return {
    isHighScore,
    addHighScore,
    listen,
  };
};

module.exports = { HallOfFameController };
