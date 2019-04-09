const CachingProxyMasquerader = require('./index');
const port = 9666;

const { isCachingProxy, isMasquerader } = CachingProxyMasquerader.getModesFromArgs();

const responseDirResolver = (cachePath, req, bodyContent, dirNameBuilder) => {
    if (!_.isFunction(dirNameBuilder)) {
        throw `Expected dirResolver to be function, got ${typeof dirNameBuilder}`;
    }

    let API = req.url.split('?')[0].split('/')[1];
    const params = paramsService.getParams(bodyContent, req);
    const paramsObj = paramsService.getParamsObj(params);
    const sellerId = paramsObj.SellerId;
    const action = paramsObj.Action;

    const nextTokenParam = paramsService.getParam(params, 'NextToken');
    
    if (typeof nextTokenParam !== 'undefined' && isCachingProxy) {
        const nextToken = nextTokenParam.value;
        let nextTokenRegistryObj = {};
        nextTokenRegistryObj[nextToken] = nextTokenService.getHashedNextToken(nextToken);
        nextTokenService.appendNextTokenToNextTokenRegistry(nextTokenRegistryObj, cachePath);
    }

    const relevantParams = paramsService.filterIrrelevantParams(params);
    const relevantParamsWithHashedNextToken = nextTokenService.replaceNextTokenInParams(relevantParams);
    const encodedRequest = encodeRequest(relevantParamsWithHashedNextToken);

    const sellerIdDirPath = dirNameBuilder(cachePath, sellerId);
    const APIDirPath = dirNameBuilder(sellerIdDirPath, API);
    const actionDirPath = dirNameBuilder(APIDirPath, action);

    let requestDir = actionDirPath;

    if (encodedRequest.length > 128) {
        requestDir = encodedRequest.split('&').reduce((prev, cur) => {
            return dirNameBuilder(prev, cur);
        }, actionDirPath);
    } else {
        requestDir = dirNameBuilder(actionDirPath, encodedRequest);
    }

    return requestDir;
}

const encodeRequest = (relevantParams) => {
    return relevantParams
            .map((param) => `${param.name}=${param.value}`)
            .join('&');
}

// eslint-disable-next-line no-unused-vars
const cachingProxyMasquerader = new CachingProxyMasquerader({
    port: port,
    isCachingProxy: isCachingProxy,
    isMasquerader: isMasquerader,
    responseDirResolver: responseDirResolver,
    cachingProxyOptions: {
        proxyHost: 'mws.amazonservices.com',
        proxyHostPort: 80,
        proxyRoute: '/',
        expressHttpProxyOptions: {
            https: true
        }
    },
    masqueraderOptions: {

    }
});