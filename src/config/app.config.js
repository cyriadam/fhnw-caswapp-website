const path = require("path");
const { env } = require("yargs");
require("dotenv").config({ path: path.join(__dirname, "/../../config/process.env"), debug: false, override: false });

const appProperties = {
  portDefault: 3000,
  maintenanceMode: false,
  filePersistenceFolder: "data",
};

const hbsProperties = {
  author: "Cyril Adam",
  info: "Prof. Dierk König",
};

const gameProperties = {
  hallOfFameFileName: "hallOfFame.json",
  hallOfFameNbRecords: 10, // keep top N scores
  hallOfFameExpiredDelay: 30, // score expired for hallOfFame after N day(s), set to -1 to diseable
  dataPoolFileName: "dataPool.json",
  dataPoolPersistTimeOut: 10, // if the dataPool is updated, the data are persisted only after this delay (en sec)
};

module.exports = { appProperties, hbsProperties, gameProperties };
