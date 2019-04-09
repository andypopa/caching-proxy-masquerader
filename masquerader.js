const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const bodyParser = require('body-parser');
const cacheService = require('./services/cache.service');
const loggerService = require('./logger.service');

const defaultOnListen = (port) => {
    // eslint-disable-next-line no-console
    console.log(`Caching proxy listening on port ${port}`);
}

const defaultGetStatus = (cache) => {
    if (cache.indexOf('<Code>RequestThrottled</Code>') !== -1) return 503;
    if (cache.indexOf('<Code>QuotaExceeded</Code>') !== -1) return 503;
    return 200;
}

const defaultGetMasqueraderRequestHandler = (masquerader) => (req, res) => {
    let paramsEncoded = [];
    _.forOwn(req.body, (v, k) => {
        paramsEncoded.push(`${k}=${v}`);
    });
    let bodyContent = paramsEncoded.join('&');
    const cache = cacheService.getCachedResponse(masquerader.cachePath, req, bodyContent, false);
    res.status(masquerader.getStatus(cache)).send(cache);
}

const defaultMasqueraderResponseFileLogger = (masquerader, responseDir) => {
    const savedResponsesNo = fs.readdirSync(responseDir)
        .filter((a) => a[0] !== '.')
        .length;

    return `${masquerader.masqueradingDataSource[responseDir] + '/' + savedResponsesNo}`
}

let defaultMasqueraderResponseFileResolver = (masquerader, responseDir) => {
    const savedResponsesNo = fs.readdirSync(responseDir)
        .filter((a) => a[0] !== '.')
        .length;

    if (typeof masquerader.masqueradingDataSource[responseDir] === 'undefined') {
        masquerader.masqueradingDataSource[responseDir] = 1;
    } else {
        masquerader.masqueradingDataSource[responseDir] = masquerader.masqueradingDataSource[responseDir] < savedResponsesNo ?
            masquerader.masqueradingDataSource[responseDir] + 1 :
            1;
    }
    const responseFilename = masquerader.masqueradingDataSource[responseDir].toString();
    return responseFilename;
}

class Masquerader {
    constructor(masqueraderOptions) {
        this.getMasqueraderRequestHandler = masqueraderOptions.getMasqueraderRequestHandler || defaultGetMasqueraderRequestHandler;
        this.getStatus = masqueraderOptions.getStatus || defaultGetStatus;

        this.onListen = masqueraderOptions.onListen || defaultOnListen;
        
        this.masqueraderResponseFileLogger = masqueraderOptions.masqueraderResponseFileLogger || defaultMasqueraderResponseFileLogger;
        this.masqueraderResponseFileResolver = masqueraderOptions.masqueraderResponseFileResolver || defaultMasqueraderResponseFileResolver;

        this.initialize();
    }

    getCachedResponse(responseDirResolver, cachePath, req, bodyContent) {
        const responseDir = responseDirResolver(cachePath, req, bodyContent, Masquerader.dirNameBuilder);
        const responseFilename = this.masqueraderResponseFileResolver(this, responseDir);
        const responsePath = path.join(responseDir, responseFilename);

        loggerService.logMasquerading(this.masqueraderResponseFileLogger(this, responseDir));

        return fs.readFileSync(responsePath, 'utf8');
    }

    static dirNameBuilder(a, b) {
        return path.join(a, b)
    }

    initialize() {
        this.configureExpressApp();
    }

    configureExpressApp() {
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.all('*', this.getMasqueraderRequestHandler(this));
    }
}

module.exports = Masquerader;