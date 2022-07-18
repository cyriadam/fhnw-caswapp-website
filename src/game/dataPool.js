const fs = require('fs').promises;
const path = require('path');
const { appProperties: { filePersistenceFolder }, gameProperties: { dataPoolFileName, dataPoolPersistTimeOut } } = require("../config/app.config");
const { Observable, ObservableObjectProperties } = require("../utils/observable");
const { createResponse } = require("../utils/io-message");
const { random } = require("../utils/general");

const log4js = require("../services/log4j");
const logger = log4js.getLogger("dataPool".toFixed(10));
logger.level = "debug";

const DataPoolController = () => {

    // const dataPool = ObservableObjectProperties({nbPlayerBullets:3, nbBombs:10, gameDuration:30, gameTimeOut:30, welcomeText:'Welcome!'});
    const dataSet = ObservableObjectProperties({});
    const dataSetDefaultValues = {nbPlayerBullets:3, nbBombs:10, gameDuration:30, gameTimeOut:30, welcomeText:'Welcome!'};
    const dataSetDefaultKeys = Object.keys(dataSetDefaultValues);
    const dataSetTmp = ObservableObjectProperties({});

    const loadDataPool = async () => {
        logger.info(`load dataPool`);

        let dataPoolValues = dataSetDefaultValues;
        try {
            // rem : use __dirname instead of __basedir due to heroku settings
            // const data = await fs.readFile(path.join(__basedir, filePersistenceFolder, dataPoolFileName), "utf-8");
            const data = await fs.readFile(path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName), "utf-8");
            logger.debug(`read file ${path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName)} : [${JSON.stringify(data)}]`)
            dataPoolValues = { ...dataPoolValues, ...JSON.parse(data) };
        } catch (err) {
            logger.error(`Error while readding the ${dataPoolFileName} file : ${err}`);
        }
        logger.info(`loadDataPool : ${JSON.stringify(dataPoolValues)}`)
        dataSet.setValue(dataPoolValues);
    }

    const persistDataPool = async () => {
        let data=dataSet.getModel();
        // persist only the keys from reference model dataPoolDefaultValues
        Object.keys(data).forEach(key => { if(!dataSetDefaultKeys.includes(key)) delete data[key]; });

        if (!data||Object.keys(data).length==0) return;
        logger.info(`persist DataPool : ${JSON.stringify(data)}`);

        try {
            // await fs.writeFile(path.join(__basedir, filePersistenceFolder, dataPoolFileName), JSON.stringify(data));
            await fs.writeFile(path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName), JSON.stringify(data));
        } catch (err) {
            logger.error(`Error while writting the ${dataPoolFileName} file : ${err}`);
        }
    }

    const listen = (socket) => {
        let rmDataPoolSubscriptions = [];

        const dataPoolSubscribe = (dataSet) => {
            return dataSet.onChange(value => {
                logger.debug(`emit dataPool(${JSON.stringify(value)})`);
                socket.emit('dataPoolValue', value);
            });
        }

        socket.on('dataPoolSubscribe', (callback) => {
            logger.info(`WebSocket(id=${socket.id}) send dataPoolSubscribe()`);
            rmDataPoolSubscriptions.push(dataPoolSubscribe(dataSet));
            rmDataPoolSubscriptions.push(dataPoolSubscribe(dataSetTmp));
            if (callback) callback(createResponse());
        });

        socket.on('setDataPoolValue', (data, callback) => {
            logger.info(`WebSocket(id=${socket.id}) send setDataPoolValue(${JSON.stringify(data)})`);
            setValue(data);
            if (callback) callback(createResponse());
        });

        // -- disconnect --
        socket.on('disconnect', () => {
            logger.info(`WebSocket(id=${socket.id}) disconnect... rmDataPoolSubscription()`);
            rmDataPoolSubscriptions.forEach(rmDataPoolSubscription => rmDataPoolSubscription());
        })
    }

    const initDataPool = async () => {
        let timeoutPersist;

        await loadDataPool();
        dataSet.onChange( _ => {
            if(timeoutPersist) clearTimeout(timeoutPersist);
            timeoutPersist = setTimeout(() => persistDataPool(), dataPoolPersistTimeOut*1000);
        });
    }

    const getValue = name => (dataSet.hasObs(name))?dataSet.getValue(name):dataSetTmp.setVagetValuelue(name);

    const setValue = data => {
        const name = Object.keys(data)[0];
        if(dataSet.hasObs(name)) dataSet.setValue(data);
        else dataSetTmp.setValue(data);
    };

    initDataPool();

    return {
        listen, getValue, setValue
    }
}

module.exports = { DataPoolController }
