const proxy = require('express-http-proxy');
const cacheService = require('./services/cache.service');

const getUserResDecorator = (cachePath, cachingProxy) => {
    return (proxyRes, data, req, userRes, bodyContent) => {
        cacheService.cache(cachePath, data, req, bodyContent, cachingProxy);
        return data;
    }
}

const onListen = (port) => {
    // eslint-disable-next-line no-console
    console.log(`Caching proxy listening on port ${port}`);
}

const configureExpressApp = (app, cachePath) => {
    let appOptions = {
        https: true,
        userResDecorator: getUserResDecorator(cachePath, true)
    }

    app.use('/', proxy('mws.amazonservices.com', appOptions));
}

module.exports = {
    onListen: onListen,
    configureExpressApp: configureExpressApp
}