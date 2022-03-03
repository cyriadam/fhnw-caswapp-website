const log4js = require('log4js');
const log4jConfig = require('./../config/log4j.config');

log4js.configure({
  appenders: {
    'file':     {type: 'fileSync', filename: `${log4jConfig.filename}`},
    'console' : {type: 'console'}
  },
  // categories: { default: { appenders: ['file', 'console'], level: log4jConfig.level } }
  // categories: { default: { appenders: ['file'], level: log4jConfig.level } }
  categories: { default: { appenders: ['console'], level: log4jConfig.level } }
});

module.exports =  log4js;
