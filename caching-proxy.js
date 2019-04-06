const proxy = require('express-http-proxy');
const cacheService = require('./services/cache.service');

const defaultGetUserResDecorator = (cachePath) => (proxyRes, data, req, userRes, bodyContent) => {
    cacheService.cache(cachePath, data, req, bodyContent);
    return data;
}

const defaultProxyRoute = '/';
const defaultProxyHost = '127.0.0.1';
const defaultExpressHttpProxyOptions = {
    https: true
}

const onListen = (port) => {
    // eslint-disable-next-line no-console
    console.log(`Caching proxy listening on port ${port}`);
}

const configureExpressApp = (app, cachePath, cachingProxyOptions) => {
    let proxyHost = cachingProxyOptions.proxyHost || defaultProxyHost;
    let proxyRoute = cachingProxyOptions.proxyRoute || defaultProxyRoute;
    let expressHttpProxyOptions = cachingProxyOptions.expressHttpProxyOptions || defaultExpressHttpProxyOptions;
    let getUserResDecorator = cachingProxyOptions.getUserResDecorator || defaultGetUserResDecorator;

    let appOptions = {};
    
    Object.assign(appOptions, expressHttpProxyOptions);
    Object.assign(appOptions, {
        userResDecorator: getUserResDecorator(cachePath)
    });

    app.use(proxyRoute, proxy(proxyHost, appOptions));
}

module.exports = {
    onListen: onListen,
    configureExpressApp: configureExpressApp
}