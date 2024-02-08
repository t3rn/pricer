"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCache = void 0;
/**
 * Manages the caching of asset prices for single or multiple networks to optimize performance and reduce API calls.
 */
class PriceCache {
    /**
     * Initializes a new instance of the PriceCache class with configuration settings.
     *
     * @param _config Configuration settings for the price cache, including multichain support and cleanup intervals.
     */
    constructor(_config) {
        this.cacheSingleNetwork = new Map();
        this.cacheMultiNetwork = new Map();
        this.config = _config;
    }
    /**
     * Retrieves the price of an asset from the cache, considering the network if multichain is enabled.
     *
     * @param asset The asset for which to retrieve the price.
     * @param network The network from which to retrieve the price if multichain is enabled.
     * @return The price of the asset if found, undefined otherwise.
     */
    get(asset, network) {
        if (this.config.pricer.useMultichain) {
            return this.getPriceMultiNetwork(asset, network);
        }
        else {
            return this.getPriceSingleNetwork(asset);
        }
    }
    /**
     * Sets the price of an asset in the cache for a specific network if multichain is enabled, or globally otherwise.
     *
     * @param asset The asset for which to set the price.
     * @param network The network on which the price is set if multichain is enabled.
     * @param price The price to set for the asset.
     * @return The updated cache object.
     */
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
    /**
     * Retrieves the entire cache. Use cautiously, primarily for debugging or testing.
     *
     * @return The complete cache, either for a single network or multiple networks based on configuration.
     */
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
    /**
     * Retrieves the price of an asset for a single network scenario from the cache.
     *
     * @param asset The asset for which to retrieve the price.
     * @return The price of the asset if found, undefined otherwise.
     */
    getPriceSingleNetwork(asset) {
        return this.cacheSingleNetwork.get(asset);
    }
    /**
     * Retrieves the price of an asset across multiple networks from the cache.
     *
     * @param asset The asset for which to retrieve the price.
     * @param network The network for which to retrieve the price.
     * @return The price of the asset on the specified network if found, undefined otherwise.
     */
    getPriceMultiNetwork(asset, network) {
        var _a;
        return (_a = this.cacheMultiNetwork.get(asset)) === null || _a === void 0 ? void 0 : _a.get(network);
    }
    /**
     * Sets the price of an asset in a single network scenario in the cache.
     *
     * @param asset The asset for which to set the price.
     * @param price The price to set for the asset.
     * @return The updated cache for a single network.
     */
    setPriceSingleNetwork(asset, price) {
        return this.cacheSingleNetwork.set(asset, price);
    }
    /**
     * Sets the price of an asset across multiple networks in the cache.
     *
     * @param asset The asset for which to set the price.
     * @param network The network on which the price is set.
     * @param price The price to set for the asset.
     * @return The updated network-to-price map for the specified asset.
     */
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