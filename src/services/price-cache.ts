import { Config } from '../config/config'
import {
  AssetAndAddress,
  NetworkNameOnPriceProvider,
  SupportedAssetPriceProvider,
} from '../config/price-provider-assets'
import { logger } from '../utils/logger'

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
   * @param assetObj
   * @return The price of the asset if found, undefined otherwise.
   */
  async get(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    assetObj: AssetAndAddress,
  ): Promise<string | null> {
    let price = this.config.pricer.useMultichain
      ? this.getPriceMultiNetwork(asset, network)
      : this.getPriceSingleNetwork(asset)

    if (price !== null) {
      return price
    }

    if (assetObj && assetObj.address) {
      price = await this.getPriceFromCacheServer(asset, network, assetObj.address)
      if (price) {
        this.set(asset, network, price)
        return price
      }
    }

    return null
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
   * Get asset price from price cache server
   *
   * @param asset
   * @param network
   * @param address
   * @return The price of the asset if found, null otherwise.
   */
  async getPriceFromCacheServer(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
    address: string,
  ): Promise<string | null> {
    const childLogger = logger.child({ asset, network, address })

    if (!this.config.pricer.proxyServerUrl) {
      childLogger.debug('Price cache server URL not defined. Default to local cache.')
      return null
    }

    if (!address) {
      childLogger.debug('No asset address was provided. Default to local cache.')
      return null
    }

    try {
      const url = new URL(`${this.config.pricer.proxyServerUrl}/pricer`)
      url.searchParams.append('network', network)
      url.searchParams.append('asset', asset)
      url.searchParams.append('address', address)

      const res = await fetch(url.toString())
      if (!res.ok) {
        const errMsg: string =
          res.status === 404
            ? 'Price for asset not found price cache server.'
            : 'Could not fetch asset price from price cache server.'
        childLogger.error({ status: res.status, err: res.statusText }, `${errMsg} Return null.`)
        return null
      }

      const data: any = await res.json()
      const price = data.price
      if (price) {
        return price
      } else {
        childLogger.error(
          { data: JSON.stringify(data) },
          'Request to price cache server is OK, but price was not found. Return null.',
        )
        return null
      }
    } catch (err: any) {
      childLogger.error({ err: err.message }, 'Unexpected error while fetching asset price from price cache server')
      return null
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
  private getPriceSingleNetwork(asset: SupportedAssetPriceProvider): string | null {
    const price = this.cacheSingleNetwork.get(asset)
    return price === undefined ? null : price
  }

  /**
   * Retrieves the price of an asset across multiple networks from the cache.
   *
   * @param asset The asset for which to retrieve the price.
   * @param network The network for which to retrieve the price.
   * @return The price of the asset on the specified network if found, undefined otherwise.
   */
  private getPriceMultiNetwork(asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider): string | null {
    const price = this.cacheMultiNetwork.get(asset)?.get(network)
    return price === undefined ? null : price
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
