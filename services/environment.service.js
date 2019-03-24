const getModesFromArgs = () => {
    if (process.argv.length < 3) {
         throw `getModesFromArgs(): You must provide the arguments 'caching-proxy' or 'masquerader' to the command-line.`;
    }

    const isCachingProxy = process.argv.indexOf('caching-proxy') !== -1;
    const isMasquerader = process.argv.indexOf('masquerader') !== -1;

    return {
        isCachingProxy: isCachingProxy,
        isMasquerader: isMasquerader
    }
}

module.exports = {
    getModesFromArgs: getModesFromArgs
}