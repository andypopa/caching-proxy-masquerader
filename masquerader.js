const bodyParser = require('body-parser');
const cacheService = require('./services/cache.service');
const _ = require('lodash');

const defaultGetStatus = (cache) => {
    if (cache.indexOf('<Code>RequestThrottled</Code>') !== -1) return 503;
    if (cache.indexOf('<Code>QuotaExceeded</Code>') !== -1) return 503;
    return 200;
}

const defaultGetMasqueraderRequestHandler = (cachePath, getStatus) => (req, res) => {
    let paramsEncoded = [];
    _.forOwn(req.body, (v, k) => {
        paramsEncoded.push(`${k}=${v}`);
    });
    let bodyContent = paramsEncoded.join('&');
    const cache = cacheService.getCachedResponse(cachePath, req, bodyContent, false);
    res.status(getStatus(cache)).send(cache);
}

const onListen = (port) => {
    // eslint-disable-next-line no-console
    console.log(`Masquerader listening on port ${port}`);
}

const configureExpressApp = (app, cachePath, masqueraderOptions) => {
    const getMasqueraderRequestHandler = masqueraderOptions.getMasqueraderRequestHandler || defaultGetMasqueraderRequestHandler;
    const getStatus = masqueraderOptions.getStatus || defaultGetStatus;

    app.use(bodyParser.urlencoded({ extended: false }));
    app.all('*', getMasqueraderRequestHandler(cachePath, getStatus));
}

module.exports = {
    onListen: onListen,
    configureExpressApp: configureExpressApp
}