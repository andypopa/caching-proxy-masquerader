const CachingProxyMasquerader = require('./index');
const port = 9666;

const { isCachingProxy, isMasquerader } = CachingProxyMasquerader.getModesFromArgs();

// eslint-disable-next-line no-unused-vars
const cachingProxyMasquerader = new CachingProxyMasquerader({
    isCachingProxy: isCachingProxy,
    isMasquerader: isMasquerader,
    port: port
});