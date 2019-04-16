/* eslint-disable no-console */
const logCaching = (req, responseFilename, responsePath) => {
        _logInternal();
        log(`Caching ${req.method} ${req.url} (${responseFilename})`);
        log(`Writing ${responsePath}`);
}

const logMasquerading = (req, responsePath, masqueradingLoggingInfo) => {
        _logInternal();
        log(`Masquerading ${req.method} ${req.url} ${'(' + masqueradingLoggingInfo + ')' || ''}`);
        log(`Reading ${responsePath}`);
}

const log = (message) => {
        _logInternal(`${(new Date()).toISOString()} ${message}`);
}

const _logInternal = (message) => {
        console.log(message || '');
}

module.exports = {
        logCaching: logCaching,
        logMasquerading: logMasquerading
}