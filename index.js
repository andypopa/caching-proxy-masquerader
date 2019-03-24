const cachingProxy = require('./caching-proxy');
const masquerader = require('./masquerader');

const environmentService = require('./services/environment.service');
const cacheService = require('./services/cache.service');

class CachingProxyMasquerader {
    constructor(config) {
        const { isCachingProxy, isMasquerader, port } = config;

        if (isCachingProxy && isMasquerader) {
            throw `This version of caching-proxy-masquerader supports running only one of the modes at a time: 'caching-proxy' or 'masquerader'. Set either isCachingProxy or isMasquerader to false in the configuration object.`
        }

        this.app = require('express')();
        this.port = port;
        this.cachePath = cacheService.getCachePath(isCachingProxy, isMasquerader);
        this.runningModules = [];

        this.maybeInitModule(cachingProxy, isCachingProxy);
        this.maybeInitModule(masquerader, isMasquerader);

        this.runApp();
    }

    static getModesFromArgs() {
        return environmentService.getModesFromArgs();
    }

    maybeInitModule (_module, shouldInit) {
        if (!shouldInit) {
            return;
        }

        _module.configureExpressApp(this.app, this.cachePath);
        this.runningModules.push(_module);
    }

    runApp() {
        this.app.listen(this.port, () => {
            this.runningModules.forEach((runningModule) => runningModule.onListen(this.port));
        });
    }
}

module.exports = CachingProxyMasquerader