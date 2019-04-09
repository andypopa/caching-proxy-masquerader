const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const loggingService = require('./services/logging.service');

const defaults = require('./defaults');

class Masquerader {
    constructor(masqueraderOptions, app, cachePath) {
        this.getRequestHandler = masqueraderOptions.getRequestHandler || defaults.masquerader.getRequestHandler;
        this.getStatus = masqueraderOptions.getStatus || defaults.masquerader.getStatus;

        this.onListen = masqueraderOptions.onListen || defaults.masquerader.onListen;
        
        this.responseDirResolver = masqueraderOptions.responseDirResolver || defaults.masquerader.responseDirResolver;
        this.responseLogInfo = masqueraderOptions.responseLogInfo || defaults.masquerader.responseLogInfo;
        this.responseFileResolver = masqueraderOptions.responseFileResolver || defaults.masquerader.responseFileResolver;

        this.app = app;
        this.cachePath = cachePath;

        this.initialize();
    }

    getCachedResponse(req, bodyContent) {
        const responseDir = this.responseDirResolver(this.cachePath, req, bodyContent, Masquerader.dirNameBuilder);
        const responseFilename = this.responseFileResolver(this, responseDir);
        const responsePath = path.join(responseDir, responseFilename);

        loggingService.logMasquerading(req, responsePath, this.responseLogInfo(this, responseDir));

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
        this.app.all('*', this.getRequestHandler(this));
    }
}

module.exports = Masquerader;