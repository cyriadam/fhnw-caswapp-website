/**
 * @module dataPool
 * pool of data synchronized with clients
 */

const fs = require("fs").promises;
const path = require("path");
const { appProperties: { filePersistenceFolder }, gameProperties: { dataPoolFileName, dataPoolPersistTimeOut }, } = require("../config/app.config");
const { ObservableObjectProperties } = require("../utils/observable");
const { createResponse } = require("../utils/io-message");

const log4js = require("../services/log4j");
const logger = log4js.getLogger("dataPool".toFixed(10));
logger.level = "error";

/**
 * DataPoolController
 * 
 * Note : 
 * - it contains 2 sets of data : the dataSet which is persistent and the dataSetTmp (no persistent)
 * @returns {Object} { setValue(), getValue(), listen() }
 */
const DataPoolController = () => {
  const dataSet = ObservableObjectProperties({});
  const dataSetDefaultValues = { nbPlayerBullets: 3, nbBombs: 10, gameDuration: 30, gameTimeOut: 60, welcomeText: "Welcome!" };
  const dataSetDefaultKeys = Object.keys(dataSetDefaultValues);
  const dataSetTmp = ObservableObjectProperties({});

  /**
   * initialise the dataPool (read from file)
   */
  const loadDataPool = async () => {
    logger.info(`load dataPool`);

    let dataPoolValues = dataSetDefaultValues;
    try {
      // rem : use __dirname instead of __basedir due to heroku settings
      // const data = await fs.readFile(path.join(__basedir, filePersistenceFolder, dataPoolFileName), "utf-8");
      const data = await fs.readFile(path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName), "utf-8");
      logger.debug(`read file ${path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName)} : [${JSON.stringify(data)}]`);
      dataPoolValues = { ...dataPoolValues, ...JSON.parse(data) };
    } catch (err) {
      logger.error(`Error while readding the ${dataPoolFileName} file : ${err}`);
    }
    logger.info(`loadDataPool : ${JSON.stringify(dataPoolValues)}`);
    dataSet.setValue(dataPoolValues);
  };

  /**
   * Persist the variables in the filesystem
   */
  const persistDataPool = async () => {
    let data = dataSet.getModel();
    // persist only the keys from reference model dataPoolDefaultValues
    Object.keys(data).forEach((key) => {
      if (!dataSetDefaultKeys.includes(key)) delete data[key];
    });

    if (!data || Object.keys(data).length == 0) return;
    logger.info(`persist DataPool : ${JSON.stringify(data)}`);

    try {
      // await fs.writeFile(path.join(__basedir, filePersistenceFolder, dataPoolFileName), JSON.stringify(data));
      await fs.writeFile(path.join(__dirname, `/../../${filePersistenceFolder}`, dataPoolFileName), JSON.stringify(data));
    } catch (err) {
      logger.error(`Error while writting the ${dataPoolFileName} file : ${err}`);
    }
  };

  /**
   * Register a socket client and listen for 'dataPoolSubscribe', 'setDataPoolValue' and 'disconnect' events
   * @param {*} socket 
   */
  const listen = (socket) => {
    let rmDataPoolSubscriptions = [];

    const dataPoolSubscribe = (dataSet) => {
      return dataSet.onChange((value) => {
        logger.debug(`emit dataPool(${JSON.stringify(value)})`);
        socket.emit("dataPoolValue", value);
      });
    };

    // subscribe to dataPool change notification
    socket.on("dataPoolSubscribe", (callback) => {
      logger.info(`WebSocket(id=${socket.id}) send dataPoolSubscribe()`);
      rmDataPoolSubscriptions.push(dataPoolSubscribe(dataSet));
      rmDataPoolSubscriptions.push(dataPoolSubscribe(dataSetTmp));
      if (callback) callback(createResponse());
    });

    // the client set the value of a variable of the dataPool
    socket.on("setDataPoolValue", (data, callback) => {
      logger.info(`WebSocket(id=${socket.id}) send setDataPoolValue(${JSON.stringify(data)})`);
      setValue(data);
      if (callback) callback(createResponse());
    });

    // -- disconnect --
    socket.on("disconnect", () => {
      logger.info(`WebSocket(id=${socket.id}) disconnect... rmDataPoolSubscription()`);
      rmDataPoolSubscriptions.forEach((rmDataPoolSubscription) => rmDataPoolSubscription());
    });
  };

  /**
   * initialise the dataPool
   * 
   * Note that the persistence is done with a delay to optimise the performances
   */
  const initDataPool = async () => {
    let timeoutPersist;

    await loadDataPool();
    dataSet.onChange((_) => {
      if (timeoutPersist) clearTimeout(timeoutPersist);
      timeoutPersist = setTimeout(() => persistDataPool(), dataPoolPersistTimeOut * 1000);    // point of interest
    });
  };

  const getValue = (name) => (dataSet.hasObs(name) ? dataSet.getValue(name) : dataSetTmp.getValue(name));

  const setValue = (data) => {
    const name = Object.keys(data)[0];
    if (dataSet.hasObs(name)) dataSet.setValue(data);
    else dataSetTmp.setValue(data);
  };

  initDataPool();

  return {
    listen,
    getValue,
    setValue,
  };
};

module.exports = { DataPoolController };
