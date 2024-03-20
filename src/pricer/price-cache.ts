import { Config } from '../config/config'
import {
  AssetAndAddress,
  NetworkNameOnPriceProvider,
  SupportedAssetPriceProvider,
} from '../config/price-provider-assets'
import axios from 'axios'

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
  async get(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    assetObj?: AssetAndAddress,
  ): Promise<string | undefined> {
    const redisPrice = await this.getPriceRedis(asset, network, assetObj?.address ?? '')
    if (redisPrice !== undefined) {
      return redisPrice
    }

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
  ): NetworkToPriceMap | PriceCacheSingleNetwork {
    if (this.config.pricer.useMultichain) {
      return this.setPriceMultiNetwork(asset, network, price)
    } else {
      return this.setPriceSingleNetwork(asset, price)
    }
  }

  /**
   * Get price from Redis cache
   *
   * @param asset
   * @param network
   * @return The price of the asset if found, undefined otherwise.
   */
  async getPriceRedis(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    address: string,
  ): Promise<string | undefined> {
    if (!this.config.pricer.proxyServerUrl) {
      console.debug('No Redis cache server URL is set. Defaulting to local cache.')
      return undefined
    }

    if (!address) {
      console.debug('No token address was passed. Defaulting to local cache.')
      return undefined
    }

    try {
      const response = await axios.get(`${this.config.pricer.proxyServerUrl}/pricer`, {
        params: {
          network,
          asset,
          address,
        },
      })
      const price = response.data.price
      if (price) {
        console.log(`Successfully fetched price from Redis cache for asset: ${asset} on network: ${network}`)
        return price
      }

      console.log('Request sent but price not found in Redis cache for asset:', asset, 'on network:', network)
      return undefined
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          console.log('Price not found in Redis cache for asset:', asset, 'on network:', network)
        } else {
          console.error('Error fetching from Redis cache', error)
        }
      } else {
        console.error('An unexpected error occurred', error)
      }
      return undefined
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
