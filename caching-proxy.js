const fs = require('fs');
const path = require('path');

const proxy = require('express-http-proxy');
const loggingService = require('./services/logging.service')
const cacheService = require('./services/cache.service');

const defaultProxyRoute = '/';
const defaultProxyHost = '127.0.0.1';
const defaultProxyHostPort = 80;
const defaultExpressHttpProxyOptions = {
    https: false
}

const defaultOnListen = (port) => {
    // eslint-disable-next-line no-console
    console.log(`Caching proxy listening on port ${port}`);
}

const defaultGetUserResDecorator = (cachePath) => (proxyRes, data, req, userRes, bodyContent) => {
    cacheService.cache(cachePath, data, req, bodyContent);
    return data;
}

const defaultResponseFileResolver = (requestFolder) => {
    const savedResponsesNo = fs.readdirSync(requestFolder)
    .filter((a) => a[0] !== '.')
    .length;

    const responseNo = savedResponsesNo + 1;
    const responseFilename = responseNo.toString();
    return responseFilename;
}

class CachingProxy {
    constructor(app, cachePath, cachingProxyOptions, responseDirResolver, responseFileResolver) {
        this.app = app;

        this.cachePath = cachePath;

        this.proxyHost = cachingProxyOptions.proxyHost || defaultProxyHost;
        this.proxyHostPort = cachingProxyOptions.proxyHostPort || defaultProxyHostPort;
        this.proxyRoute = cachingProxyOptions.proxyRoute || defaultProxyRoute;
        this.expressHttpProxyOptions = cachingProxyOptions.expressHttpProxyOptions || defaultExpressHttpProxyOptions;
        this.getUserResDecorator = cachingProxyOptions.getUserResDecorator || defaultGetUserResDecorator;

        this.responseDirResolver = responseDirResolver || defaultResponseDirResolver;
        this.responseFileResolver = responseFileResolver || defaultResponseFileResolver;

        this.onListen = cachingProxyOptions.onListen || defaultOnListen;

        this.appOptions = {};

        this.initialize();
    }

    initialize() {
        this.configureExpressApp();
    }

    static dirNameBuilder(parentDirPath, subdirName) {
        const subdirPath = path.join(parentDirPath, subdirName);
        if (!fs.existsSync(subdirPath)) {
            fs.mkdirSync(subdirPath);
        }
        return subdirPath;
    }

    configureExpressApp() {
        Object.assign(this.appOptions, this.expressHttpProxyOptions);
        Object.assign(this.appOptions, {
            userResDecorator: this.getUserResDecorator(this.cachePath)
        });

        this.app.use(this.proxyRoute, proxy(`${this.proxyHost}:${this.proxyHostPort}`, this.appOptions));
    }

    cache (responseDirResolver, responseFileResolver, cachePath, data, req, bodyContent) {
        const responseDir = responseDirResolver(cachePath, req, bodyContent, CachingProxy.dirNameBuilder);
        const responseFilename = responseFileResolver(responseDir);
        const responsePath = path.join(responseDir, responseFilename);
    
        loggingService.logCaching(req, responseFilename, responsePath);
    
        fs.writeFileSync(responsePath, data);
        return responsePath;
    }
}

module.exports = CachingProxy;