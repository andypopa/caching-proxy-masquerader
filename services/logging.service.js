/* eslint-disable no-console */
const logCaching = (req, responseFilename, responsePath) => {
        console.log()
        console.log(`Caching ${req.method} ${req.url} (${responseFilename})`);
        console.log(`Writing ${responsePath}`);
}

const logMasquerading = (req, responsePath, masqueradingLoggingInfo) => {
        console.log()
        console.log(`Masquerading ${req.method} ${req.url} ${'(' + masqueradingLoggingInfo + ')' || ''}`);
        console.log(`Reading ${responsePath}`);
}

module.exports = {
        logCaching: logCaching,
        logMasquerading: logMasquerading
}