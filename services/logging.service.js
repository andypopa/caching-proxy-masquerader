/* eslint-disable no-console */
const chalk = require('chalk');

const formatMethod = (method) => {
        return method.length < 4 ? method + ' ' : method;
}

const logCaching = (req, responseFilename, responsePath) => {
        log(`${chalk.green('CACH')} ${formatMethod(req.method)} ${req.url} ${responseFilename} -> ${responsePath}`);
}

const logMasquerading = (req, responsePath, masqueradingLoggingInfo) => {
        log(`${chalk.blue('MASQ')} 200 ${formatMethod(req.method)} ${req.url} ${responsePath} ${'(' + masqueradingLoggingInfo + ')' || ''}`);
}

const logNotFound = (req, responsePath) => {
        log(`${chalk.red('ERR ')} 404 ${formatMethod(req.method)} ${req.url} ${responsePath}`);
}

const info = (message) => {
        log(`${chalk.green('INFO')} ${message}`);
}

const log = (message) => {
        _logInternal(`${(new Date()).toISOString()} ${message}`);
}

const _logInternal = (message) => {
        console.log(message || '');
}

module.exports = {
        logCaching: logCaching,
        logMasquerading: logMasquerading,
        logNotFound: logNotFound,
        log: log,
        info: info
}