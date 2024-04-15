"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCache = void 0;
const logger_1 = require("../utils/logger");
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
     * @param assetObj
     * @return The price of the asset if found, undefined otherwise.
     */
    get(asset, network, assetObj) {
        return __awaiter(this, void 0, void 0, function* () {
            let price = this.config.pricer.useMultichain
                ? this.getPriceMultiNetwork(asset, network)
                : this.getPriceSingleNetwork(asset);
            if (price !== undefined) {
                return price;
            }
            if (assetObj && assetObj.address) {
                price = yield this.getPriceFromCacheServer(asset, network, assetObj.address);
                if (price) {
                    this.set(asset, network, price);
                    return price;
                }
            }
            return null;
        });
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
     * Get asset price from price cache server
     *
     * @param asset
     * @param network
     * @param address
     * @return The price of the asset if found, null otherwise.
     */
    getPriceFromCacheServer(asset, network, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const childLogger = logger_1.logger.child({ asset, network, address });
            if (!this.config.pricer.proxyServerUrl) {
                childLogger.debug('Price cache server URL not defined. Default to local cache.');
                return null;
            }
            if (!address) {
                childLogger.debug('No asset address was provided. Default to local cache.');
                return null;
            }
            try {
                const url = new URL(`${this.config.pricer.proxyServerUrl}/pricer`);
                url.searchParams.append('network', network);
                url.searchParams.append('asset', asset);
                url.searchParams.append('address', address);
                const res = yield fetch(url.toString());
                if (!res.ok) {
                    const errMsg = res.status === 404
                        ? 'Price for asset not found price cache server.'
                        : 'Could not fetch asset price from price cache server.';
                    childLogger.error({ status: res.status, err: res.statusText }, `${errMsg} Return null.`);
                    return null;
                }
                const data = yield res.json();
                const price = data.price;
                if (price) {
                    return price;
                }
                else {
                    childLogger.error({ data: JSON.stringify(data) }, 'Request to price cache server is OK, but price was not found. Return null.');
                    return null;
                }
            }
            catch (err) {
                childLogger.error({ err: err.message }, 'Unexpected error while fetching asset price from price cache server');
                return null;
            }
        });
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
        const price = this.cacheSingleNetwork.get(asset);
        return price === undefined ? null : price;
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
        const price = (_a = this.cacheMultiNetwork.get(asset)) === null || _a === void 0 ? void 0 : _a.get(network);
        return price === undefined ? null : price;
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