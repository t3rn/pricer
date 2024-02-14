import { Config } from '../config/config'
import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from '../config/price-provider-assets'

export type PriceCacheSingleNetwork = Map<SupportedAssetPriceProvider, string>
export type NetworkToPriceMap = Map<NetworkNameOnPriceProvider, string>
export type PriceCacheMultiNetwork = Map<SupportedAssetPriceProvider, NetworkToPriceMap>

/**
 * Manages the caching of asset prices for single or multiple networks to optimize performance and reduce API calls.
 */
export class PriceCache {
  private readonly config: Config
  private cacheSingleNetwork: PriceCacheSingleNetwork = new Map<SupportedAssetPriceProvider, string>()
  private cacheMultiNetwork: PriceCacheMultiNetwork = new Map<SupportedAssetPriceProvider, NetworkToPriceMap>()

  /**
   * Initializes a new instance of the PriceCache class with configuration settings.
   *
   * @param _config Configuration settings for the price cache, including multichain support and cleanup intervals.
   */
  constructor(_config: Config) {
    this.config = _config
  }

  /**
   * Retrieves the price of an asset from the cache, considering the network if multichain is enabled.
   *
   * @param asset The asset for which to retrieve the price.
   * @param network The network from which to retrieve the price if multichain is enabled.
   * @return The price of the asset if found, undefined otherwise.
   */
  get(asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider): string | undefined {
    if (this.config.pricer.useMultichain) {
      return this.getPriceMultiNetwork(asset, network)
    } else {
      return this.getPriceSingleNetwork(asset)
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
  set(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    price: string,
  ): PriceCacheSingleNetwork | NetworkToPriceMap {
    if (this.config.pricer.useMultichain) {
      return this.setPriceMultiNetwork(asset, network, price)
    } else {
      return this.setPriceSingleNetwork(asset, price)
    }
  }

  /**
   * Periodically clean the local price cache
   */
  initCleanup() {
    setInterval(() => {
      this.clean()
    }, this.config.pricer.cleanupIntervalSec * 1000)
  }

  /**
   * Retrieves the entire cache. Use cautiously, primarily for debugging or testing.
   *
   * @return The complete cache, either for a single network or multiple networks based on configuration.
   */
  getWholeCache(): PriceCacheSingleNetwork | PriceCacheMultiNetwork {
    if (this.config.pricer.useMultichain) {
      return this.cacheMultiNetwork
    } else {
      return this.cacheSingleNetwork
    }
  }

  /**
   * NOTE: do not use externally!
   * It is public only so it can be used in tests.
   */
  clean() {
    if (this.config.pricer.useMultichain) {
      this.cacheMultiNetwork.clear()
    } else {
      this.cacheSingleNetwork.clear()
    }
  }

  /**
   * Retrieves the price of an asset for a single network scenario from the cache.
   *
   * @param asset The asset for which to retrieve the price.
   * @return The price of the asset if found, undefined otherwise.
   */
  private getPriceSingleNetwork(asset: SupportedAssetPriceProvider): string | undefined {
    return this.cacheSingleNetwork.get(asset)
  }

  /**
   * Retrieves the price of an asset across multiple networks from the cache.
   *
   * @param asset The asset for which to retrieve the price.
   * @param network The network for which to retrieve the price.
   * @return The price of the asset on the specified network if found, undefined otherwise.
   */
  private getPriceMultiNetwork(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
  ): string | undefined {
    return this.cacheMultiNetwork.get(asset)?.get(network)
  }

  /**
   * Sets the price of an asset in a single network scenario in the cache.
   *
   * @param asset The asset for which to set the price.
   * @param price The price to set for the asset.
   * @return The updated cache for a single network.
   */
  private setPriceSingleNetwork(asset: SupportedAssetPriceProvider, price: string): PriceCacheSingleNetwork {
    return this.cacheSingleNetwork.set(asset, price)
  }

  /**
   * Sets the price of an asset across multiple networks in the cache.
   *
   * @param asset The asset for which to set the price.
   * @param network The network on which the price is set.
   * @param price The price to set for the asset.
   * @return The updated network-to-price map for the specified asset.
   */
  private setPriceMultiNetwork(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    price: string,
  ): NetworkToPriceMap {
    if (!this.cacheMultiNetwork.has(asset)) {
      this.cacheMultiNetwork.set(asset, new Map<NetworkNameOnPriceProvider, string>())
    }

    return this.cacheMultiNetwork.get(asset)?.set(network, price) as NetworkToPriceMap
  }
}
