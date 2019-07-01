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

    getResponseDetails(req, bodyContent) {
        try {
            const responseDir = this.responseDirResolver(this.cachePath, req, bodyContent, Masquerader.dirNameBuilder);
            const responseFilename = this.responseFileResolver(this, responseDir);
            const responsePath = path.join(responseDir, responseFilename);

            return {
                responseDir: responseDir,
                responseFilename: responseFilename,
                responsePath: responsePath
            };
        } catch (err) {
            throw err;
        }
    }

    getCachedResponse(req, bodyContent) {
        try {
            const { responseDir, responsePath } = this.getResponseDetails(req, bodyContent);
            loggingService.logMasquerading(req, responsePath, this.responseLogInfo(this, responseDir));
            return fs.readFileSync(responsePath, 'utf8');
        } catch (err) {
            throw err;
        }
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