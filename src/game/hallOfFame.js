const fs = require('fs').promises;
const path = require('path');
const { createResponse } = require("../utils/io-message");
const { appProperties: { filePersistenceFolder }, gameProperties: { hallOfFameFileName, hallOfFameNbRecords, hallOfFameExpiredDelay=-1 } } = require("../config/app.config");
const { Observable } = require("../utils/observable");

const log4js = require("../services/log4j");
const logger = log4js.getLogger("hallOfFame".toFixed(10));
const OneDay = 24*60*60*1000;
logger.level = "error";

const HallOfFameControler = () => {

    const hallOfFame = Observable([]);

    const filler = Array.from({ length: hallOfFameNbRecords }, (v, i) => ({ playerId: -1, playerName: 'noname', score: 20, comment: '', createdAt:-1 }))

    const cleanScores = (scores) => {
        let now =new Date().getTime();
        [...scores].filter(a => a.createdAt>0&&now-a.createdAt>hallOfFameExpiredDelay*OneDay).forEach(score=>logger.info(`remove expired score of ${score.playerName} from hallOfFame`));
        return [...scores, ...filler].filter(a => (a.createdAt<0||hallOfFameExpiredDelay<=0||now-a.createdAt<hallOfFameExpiredDelay*OneDay)).sort((a, b) => a.score > b.score ? -1 : 1).slice(0, hallOfFameNbRecords);
    }

    const loadHallOfFame = async () => {
        logger.info(`load HallOfFame`);

        let scores = [];
        try {
            // rem : use __dirname instead of __basedir due to heroku settings
            // const data = await fs.readFile(path.join(__basedir, filePersistenceFolder, hallOfFameFileName), "utf-8");
            const data = await fs.readFile(path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName), "utf-8");
            logger.debug(`read file ${path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName)} : [${JSON.stringify(data)}]`)
            scores = JSON.parse(data).filter(obj => Object.keys({ playerId: -1, playerName: '', score: 0, comment: '', createdAt:-1 }).every(key => obj.hasOwnProperty(key) && obj[key] != undefined)).map(({ playerId, playerName, score, comment, createdAt}) => ({ playerId, playerName, score, comment, createdAt }));
        } catch (err) {
            logger.error(`Error while readding the ${hallOfFameFileName} file : ${err}`);
        }
        scores = cleanScores(scores);
        logger.info(`loadHallOfFame : ${JSON.stringify(scores)}`)

        hallOfFame.setValue(scores);
        hallOfFame.onChange(persistHallOfFame);
    }

    const persistHallOfFame = async (scores, oldScores) => {
        if (scores == oldScores) return;
        logger.info(`persist HallOfFame : ${JSON.stringify(scores)}`);

        try {
            // await fs.writeFile(path.join(__basedir, filePersistenceFolder, hallOfFameFileName), JSON.stringify(scores));
            await fs.writeFile(path.join(__dirname, `/../../${filePersistenceFolder}`, hallOfFameFileName), JSON.stringify(scores));
        } catch (err) {
            logger.error(`Error while writting the ${hallOfFameFileName} file : ${err}`);
        }
    }

    const isHighScore = score => hallOfFame.getValue().some(item => item.score < score);

    const addHighScore = (playerId, playerName, score) => {
        let scores = hallOfFame.getValue();
        scores.push({ playerId, playerName, score, comment: '', createdAt : new Date().getTime() });
        scores = cleanScores(scores);
        hallOfFame.setValue(scores);
    }


    const listen = (socket) => {
        let rmHofSubscription;

        socket.on('hofSubscribe', (callback) => {
            logger.info(`WebSocket(id=${socket.id}) send hofSubscribe()`);
            rmHofSubscription = hallOfFame.onChange(value => {
                if (value.length) {
                    logger.debug('emit hallOfFame')
                    socket.emit('hallOfFame', value);
                }
            });
            if (callback) callback(createResponse());
        });

        socket.on('hofReset', (callback) => {
            logger.info(`WebSocket(id=${socket.id}) send hofReset()`); 
            hallOfFame.setValue([...filler]);
            if (callback) callback(createResponse());
        });

        socket.on('hofAddComment', ({ playerId, comment }, callback) => {
            logger.info(`WebSocket(id=${socket.id}) playerId(${playerId}) send hofAddComment('${comment}')`); 
            let scores = hallOfFame.getValue();
            (scores.find(score=>score.playerId==playerId)||{comment}).comment=comment;
            hallOfFame.setValue([...scores]);
            if (callback) callback(createResponse());
        });

        // -- disconnect --
        socket.on('disconnect', () => {
            logger.info(`WebSocket(id=${socket.id}) disconnect... rmHofSubscription()`);
            if(rmHofSubscription) rmHofSubscription();
        })
    }

    loadHallOfFame();

    return {
        isHighScore,
        addHighScore,
        listen
    }
}

module.exports = { HallOfFameControler }
