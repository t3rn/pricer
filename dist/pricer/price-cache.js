"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCache = void 0;
class PriceCache {
    constructor(_config) {
        this.cacheSingleNetwork = new Map();
        this.cacheMultiNetwork = new Map();
        this.config = _config;
    }
    get(asset, network) {
        if (this.config.pricer.useMultichain) {
            return this.getPriceMultiNetwork(asset, network);
        }
        else {
            return this.getPriceSingleNetwork(asset);
        }
    }
    set(asset, network, price) {
        if (this.config.pricer.useMultichain) {
            return this.setPriceMultiNetwork(asset, network, price);
        }
        else {
            return this.setPriceSingleNetwork(asset, price);
        }
    }
    /**
     * Periodically clean the local price cache
     */
    initCleanup() {
        setInterval(() => {
            this.clean();
        }, this.config.pricer.cleanupIntervalSec * 1000);
    }
    getWholeCache() {
        if (this.config.pricer.useMultichain) {
            return this.cacheMultiNetwork;
        }
        else {
            return this.cacheSingleNetwork;
        }
    }
    /**
     * NOTE: do not use externally!
     * It is public only so it can be used in tests.
     */
    clean() {
        if (this.config.pricer.useMultichain) {
            this.cacheMultiNetwork.clear();
        }
        else {
            this.cacheSingleNetwork.clear();
        }
    }
    getPriceSingleNetwork(asset) {
        return this.cacheSingleNetwork.get(asset);
    }
    getPriceMultiNetwork(asset, network) {
        var _a;
        return (_a = this.cacheMultiNetwork.get(asset)) === null || _a === void 0 ? void 0 : _a.get(network);
    }
    setPriceSingleNetwork(asset, price) {
        return this.cacheSingleNetwork.set(asset, price);
    }
    setPriceMultiNetwork(asset, network, price) {
        var _a;
        if (!this.cacheMultiNetwork.has(asset)) {
            this.cacheMultiNetwork.set(asset, new Map());
        }
        return (_a = this.cacheMultiNetwork.get(asset)) === null || _a === void 0 ? void 0 : _a.set(network, price);
    }
}
exports.PriceCache = PriceCache;
//# sourceMappingURL=price-cache.js.map