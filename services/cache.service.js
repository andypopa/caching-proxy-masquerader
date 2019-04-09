const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

const loggerService = require('./logger.service');

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

//should be in Cache service
const getCaches = () => {
    try {
        const dataFolder = cachingProxyMasquerader.cachesDirPath;

        // this 'filters files'
        // we need it to 'just include diretories'
        const caches = fs.readdirSync(dataFolder).filter((a) => a.indexOf('.') === -1);
        return caches;
    } catch (err) {
        throw err;
    }
}

//should be in Cache service
const getLatestCache = () => {
    const caches = getCaches();

    if (caches.length === 0) {
        throw 'No caches available. Run mwscpm in caching-proxy mode before running in masquerader mode.';
    }

    const latestCache = caches[caches.length - 1];
    return latestCache;
}

//should be in Cache service
const getLatestCacheDir = () => {
    return path.join(cachingProxyMasquerader.cachesDirPath, getLatestCache());
}