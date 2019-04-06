const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

const loggerService = require('./logger.service');

let masqueradingDataSource;
let masqueraderResponseFileResolver = (responseDir, masqueradingDataSource) => {
    const savedResponsesNo = fs.readdirSync(responseDir)
        .filter((a) => a[0] !== '.')
        .length;

    if (typeof masqueradingDataSource[responseDir] === 'undefined') {
        masqueradingDataSource[responseDir] = 1;
    } else {
        masqueradingDataSource[responseDir] = masqueradingDataSource[responseDir] < savedResponsesNo ?
        masqueradingDataSource[responseDir] + 1 :
            1;
    }
    const responseFilename = masqueradingDataSource[responseDir].toString();
    return responseFilename;
}

let masqueraderResponseFileLogger = (responseDir, masqueradingDataSource) => {
    const savedResponsesNo = fs.readdirSync(responseDir)
        .filter((a) => a[0] !== '.')
        .length;

    return `${masqueradingDataSource[responseDir] + '/' + savedResponsesNo}`
}

const maybeMakeSubdir = (parentDirPath, subdirName) => {
    const subdirPath = path.join(parentDirPath, subdirName);
    if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath);
    }
    return subdirPath;
}

const dirNameBuilders = {
    cachingProxy: maybeMakeSubdir,
    masquerader: path.join
}

const getCachePath = (isCachingProxy, isMasquerader) => {
    const timestamp = getTimestamp(isCachingProxy, isMasquerader);

    let cachePath = '';

    if (isCachingProxy) {
        cachePath = path.join(getCachesDirPath(), timestamp);
        fs.mkdirSync(cachePath);
    } else {
        cachePath = getLatestCacheDir();
    }

    return cachePath;
}

const getTimestamp = (isCachingProxy, isMasquerader) => {
    if (typeof isCachingProxy === 'undefined' ||
        typeof isMasquerader === 'undefined') {
            throw `'isCachingProxy' and 'isMasquerader' must be passed to getTimestamp(isCachingProxy, isMasquerader). Call getModeFromArgs() to get them from the command-line, or pass them in yourself.`;
        }

    let timestamp = Date.now().toString();
    const maybeTimestampArg = process.argv[3];

    if (isMasquerader && typeof process.argv[3] === 'undefined') {
        timestamp = getLatestCache();
    }

    if (isMasquerader && typeof maybeTimestampArg !== 'undefined') {
        if (moment.isValid(+maybeTimestampArg)) {
            timestamp = getLatestCache();
        } else {
            throw `Timestamp argument '${maybeTimestampArg}' but is not a valid moment.`;
        }
    }

    return timestamp;
}

const getCachesDirPath = () => {
    return path.join(process.cwd(), '/data');
}

const getCaches = () => {
    try {
        const dataFolder = getCachesDirPath();
        const caches = fs.readdirSync(dataFolder).filter((a) => a.indexOf('.') === -1);
        return caches;
    } catch (err) {
        throw err;
    }
}

const getLatestCache = () => {
    const caches = getCaches();

    if (caches.length === 0) {
        throw 'No caches available. Run mwscpm in caching-proxy mode before running in masquerader mode.';
    }

    const latestCache = caches[caches.length - 1];
    return latestCache;
}

const getLatestCacheDir = () => {
    return path.join(getCachesDirPath(), getLatestCache());
}

const encodeRequest = (relevantParams) => {
    return relevantParams
            .map((param) => `${param.name}=${param.value}`)
            .join('&');
}

const defaultResponseFileResolver = (requestFolder) => {
    const savedResponsesNo = fs.readdirSync(requestFolder)
    .filter((a) => a[0] !== '.')
    .length;

    const responseNo = savedResponsesNo + 1;
    const responseFilename = responseNo.toString();
    return responseFilename;
}

const cache = (responseDirResolver, responseFileResolver, cachePath, data, req, bodyContent) => {
    const responseDir = responseDirResolver(cachePath, req, bodyContent, dirNameBuilders.cachingProxy);
    const responseFilename = responseFileResolver(responseDir);
    const responsePath = path.join(responseDir, responseFilename);

    loggerService.logCaching(req, responseFilename, responsePath);

    fs.writeFileSync(responsePath, data);
    return responsePath;
}

const getCachedResponse = (responseDirResolver, masqueraderResponseFileResolver, cachePath, req, bodyContent) => {
    const responseDir = responseDirResolver(cachePath, req, bodyContent, dirNameBuilders.masquerader);
    const responseFilename = masqueraderResponseFileResolver(responseDir, masqueradingDataSource);    
    const responsePath = path.join(responseDir, responseFilename);

    loggerService.logMasquerading(masqueraderResponseFileLogger(responseDir, masqueradingDataSource));

    return fs.readFileSync(responsePath, 'utf8');
}

module.exports = {
    getCachePath: getCachePath,
    getTimestamp: getTimestamp,
    getCachesFolderPath: getCachesDirPath,
    getCaches: getCaches,
    getLatestCache: getLatestCache,
    getLatestCacheFolder: getLatestCacheDir,
    getCachedResponse: getCachedResponse,
    cache: cache
}