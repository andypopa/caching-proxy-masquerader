const fs = require('fs-extra');
const path = require('path');

const proxy = require('express-http-proxy');
const loggingService = require('./services/logging.service');

const defaults = require('./defaults');

class CachingProxy {
    constructor(cachingProxyOptions, app, cachePath) {
        this.proxyHost = cachingProxyOptions.proxyHost || defaults.cachingProxy.ProxyHost;
        this.proxyHostPort = cachingProxyOptions.proxyHostPort || defaults.cachingProxy.proxyHostPort;
        this.proxyRoute = cachingProxyOptions.proxyRoute || defaults.cachingProxy.proxyRoute;
        this.expressHttpProxyOptions = cachingProxyOptions.expressHttpProxyOptions || defaults.cachingProxy.expressHttpProxyOptions;
        this.getUserResDecorator = cachingProxyOptions.getUserResDecorator || defaults.cachingProxy.getUserResDecorator;

        this.responseDirResolver = cachingProxyOptions.responseDirResolver || defaults.cachingProxy.responseDirResolver;
        this.responseFileResolver = cachingProxyOptions.responseFileResolver || defaults.cachingProxy.responseFileResolver;

        this.onListen = cachingProxyOptions.onListen || defaults.cachingProxy.onListen;

        this.appOptions = {};

        this.app = app;
        this.cachePath = cachePath;

        this.initialize();
    }

    initialize() {
        this.configureExpressApp();
    }

    static dirNameBuilder(parentDirPath, subdirName) {
        const subdirPath = path.join(parentDirPath, subdirName);
        fs.ensureDirSync(subdirPath);
        return subdirPath;
    }

    configureExpressApp() {
        Object.assign(this.appOptions, this.expressHttpProxyOptions);
        Object.assign(this.appOptions, {
            userResDecorator: this.getUserResDecorator(this)
        });

        this.app.use(this.proxyRoute, proxy(`${this.proxyHost}:${this.proxyHostPort}`, this.appOptions));
    }

    cache (data, req, bodyContent) {
        const responseDir = this.responseDirResolver(this.cachePath, req, bodyContent, CachingProxy.dirNameBuilder);
        const responseFilename = this.responseFileResolver(responseDir);
        const responsePath = path.join(responseDir, responseFilename);
    
        loggingService.logCaching(req, responseFilename, responsePath);
    
        fs.writeFileSync(responsePath, data);
        return responsePath;
    }
}

module.exports = CachingProxy;