import { Config } from '../config/config'
import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from '../config/price-provider-assets'

export type PriceCacheSingleNetwork = Map<SupportedAssetPriceProvider, string>
export type NetworkToPriceMap = Map<NetworkNameOnPriceProvider, string>
export type PriceCacheMultiNetwork = Map<SupportedAssetPriceProvider, NetworkToPriceMap>

export class PriceCache {
  private readonly config: Config
  private cacheSingleNetwork: PriceCacheSingleNetwork = new Map<SupportedAssetPriceProvider, string>()
  private cacheMultiNetwork: PriceCacheMultiNetwork = new Map<SupportedAssetPriceProvider, NetworkToPriceMap>()

  constructor(_config: Config) {
    this.config = _config
  }

  get(asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider): string | undefined {
    if (this.config.pricer.useMultichain) {
      return this.getPriceMultiNetwork(asset, network)
    } else {
      return this.getPriceSingleNetwork(asset)
    }
  }

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

  private getPriceSingleNetwork(asset: SupportedAssetPriceProvider): string | undefined {
    return this.cacheSingleNetwork.get(asset)
  }

  private getPriceMultiNetwork(
    asset: SupportedAssetPriceProvider,
    network: NetworkNameOnPriceProvider,
  ): string | undefined {
    return this.cacheMultiNetwork.get(asset)?.get(network)
  }

  private setPriceSingleNetwork(asset: SupportedAssetPriceProvider, price: string): PriceCacheSingleNetwork {
    return this.cacheSingleNetwork.set(asset, price)
  }

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
