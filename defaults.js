const fs = require('fs');
const _ = require('lodash');
const paramsService = require('./services/params.service');
const loggingService = require('./services/logging.service');
const crypto = require('crypto');

const getOnListen = (moduleType) => (port) => {
    // eslint-disable-next-line no-console
    console.log(`${moduleType} listening on port ${port}`);
};

const responseDirResolver = (cachePath, req, bodyContent, dirNameBuilder) => {
    if (!_.isFunction(dirNameBuilder)) {
        throw `Expected dirResolver to be function, got ${typeof dirNameBuilder}`;
    }
    
    const params = paramsService.getParams(bodyContent, req);
    const hashedRequest = crypto.createHash('md5').update(req.url + JSON.stringify(params)).digest('hex');

    const responseDir = dirNameBuilder(cachePath, hashedRequest);

    return responseDir;
};

const defaults = {
    cachingProxy: {
        proxyRoute: '/',
        proxyHost: '127.0.0.1',
        proxyHostPort: 80,
        expressHttpProxyOptions: {
            https: true
        },

        onListen: getOnListen('Caching proxy'),

        getUserResDecorator: (cachingProxy) => (proxyRes, data, req, userRes, bodyContent) => {
            cachingProxy.cache(data, req, bodyContent);
            return data;
        },

        responseDirResolver: responseDirResolver,

        responseFileResolver: (requestFolder) => {
            const savedResponsesNo = fs.readdirSync(requestFolder)
            .filter((a) => a[0] !== '.')
            .length;
        
            const responseNo = savedResponsesNo + 1;
            const responseFilename = responseNo.toString();
            return responseFilename;
        }
    },
    masquerader: {
        onListen: getOnListen('Masquerader'),
        
        getStatus: (cache) => {
            if (cache.indexOf('<Code>NonRetriableInternalErrorException</Code>') !== -1) return 400;
            if (cache.indexOf('<Code>RetriableInternalError</Code>') !== -1) return 500;
            if (cache.indexOf('<Code>RequestThrottled</Code>') !== -1) return 503;
            if (cache.indexOf('<Code>QuotaExceeded</Code>') !== -1) return 503;
            return 200;
        },
        
        getRequestHandler: (masquerader) => (req, res) => {
            let paramsEncoded = [];
            _.forOwn(req.body, (v, k) => {
                paramsEncoded.push(`${k}=${v}`);
            });
            let bodyContent = paramsEncoded.join('&');

            try {
                const cache = masquerader.getCachedResponse(req, bodyContent);
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Access-Control-Allow-Headers', 'Authorization');
                res.set('Allow', 'HEAD,GET,PUT,DELETE');
                res.status(masquerader.getStatus(cache)).send(cache);
            } catch (err) {
                loggingService.logNotFound(req, `ResponsePathNotFound ${err.message} ${err.stack}`);
                res.sendStatus(404);
            }
        },
        
        responseLogInfo: (masquerader, responseDir) => {
            const savedResponsesNo = fs.readdirSync(responseDir)
                .filter((a) => a[0] !== '.')
                .length;
        
            return `${masquerader.masqueradingDataSource[responseDir] + '/' + savedResponsesNo}`
        },

        responseDirResolver: responseDirResolver,
        
        responseFileResolver: (masquerader, responseDir) => {
            const savedResponsesNo = fs.readdirSync(responseDir)
                .filter((a) => a[0] !== '.')
                .length;
        
            if (typeof masquerader.masqueradingDataSource === 'undefined') {
                masquerader.masqueradingDataSource = {};
            }

            if (typeof masquerader.masqueradingDataSource[responseDir] === 'undefined') {
                masquerader.masqueradingDataSource[responseDir] = 1;
            } else {
                masquerader.masqueradingDataSource[responseDir] = masquerader.masqueradingDataSource[responseDir] < savedResponsesNo ?
                    masquerader.masqueradingDataSource[responseDir] + 1 :
                    1;
            }
            const responseFilename = masquerader.masqueradingDataSource[responseDir].toString();
            return responseFilename;
        }
    }
}

module.exports = defaults;