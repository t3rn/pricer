import { Config } from '../config/config';
import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from '../config/price-provider-assets';
export type PriceCacheSingleNetwork = Map<SupportedAssetPriceProvider, string>;
export type NetworkToPriceMap = Map<NetworkNameOnPriceProvider, string>;
export type PriceCacheMultiNetwork = Map<SupportedAssetPriceProvider, NetworkToPriceMap>;
export declare class PriceCache {
    private readonly config;
    private cacheSingleNetwork;
    private cacheMultiNetwork;
    constructor(_config: Config);
    get(asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider): string | undefined;
    set(asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider, price: string): PriceCacheSingleNetwork | NetworkToPriceMap;
    /**
     * Periodically clean the local price cache
     */
    initCleanup(): void;
    getWholeCache(): PriceCacheSingleNetwork | PriceCacheMultiNetwork;
    /**
     * NOTE: do not use externally!
     * It is public only so it can be used in tests.
     */
    clean(): void;
    private getPriceSingleNetwork;
    private getPriceMultiNetwork;
    private setPriceSingleNetwork;
    private setPriceMultiNetwork;
}
