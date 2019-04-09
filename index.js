const cachingProxy = require('./caching-proxy');
const masquerader = require('./masquerader');

const environmentService = require('./services/environment.service');
const paramsService = require('./services/params.service');

class CachingProxyMasquerader {
    constructor(config) {
        const { isCachingProxy, isMasquerader, port, cachingProxyOptions, masqueraderOptions, cachePath } = config;

        if (isCachingProxy && isMasquerader) {
            throw `This version of caching-proxy-masquerader supports running only one of the modes at a time: 'caching-proxy' or 'masquerader'. Set either isCachingProxy or isMasquerader to false in the configuration object.`
        }

        // this.cachesDirPath = process.cwd(), '/cpmcaches';

        this.app = require('express')();
        this.port = port;
        this.cachePath = cachePath;
        this.instantiatedModules = [];

        this.maybeInitModule(cachingProxy, isCachingProxy, cachingProxyOptions, this.app, this.cachePath);
        this.maybeInitModule(masquerader, isMasquerader, masqueraderOptions, this.app, this.cachePath);

        this.runApp();
    }

    static getModesFromArgs() {
        return environmentService.getModesFromArgs();
    }

    static get paramsService() {
        return paramsService;
    }

    maybeInitModule (_module, shouldInit, moduleOptions, app, cachePath) {
        if (!shouldInit) {
            return;
        }
        const instantiatedModule = new _module(moduleOptions, app, cachePath);
        this.instantiatedModules.push(instantiatedModule);
    }

    runApp() {
        this.app.listen(this.port, () => {
            this.instantiatedModules.forEach((runningModule) => runningModule.onListen(this.port));
        });
    }
}

module.exports = CachingProxyMasquerader