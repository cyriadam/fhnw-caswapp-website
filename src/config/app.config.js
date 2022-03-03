const path = require('path'); 
const { env } = require('yargs');
require('dotenv').config({ path: path.join(__dirname, '/../../config/process.env'), debug: false, override: false})

const appProperties = {
    portDefault : 3000,
    maintenanceMode : false,
}

const hbsProperties = { 
    author: 'Cyril Adam', 
    version: '1.0.0' 
}

module.exports = { appProperties, hbsProperties }
