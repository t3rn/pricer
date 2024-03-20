import { expect } from 'chai'
import { Config } from '../../../src/config/config'
import {
  NetworkToPriceMap,
  PriceCache,
  PriceCacheMultiNetwork,
  PriceCacheSingleNetwork,
} from '../../../src/pricer/price-cache'
import {
  AssetAndAddress,
  NetworkNameOnPriceProvider,
  SupportedAssetPriceProvider,
} from '../../../src/config/price-provider-assets'
import { BigNumber } from 'ethers'

describe('PriceCache', () => {
  let ethPrice: string, asset: SupportedAssetPriceProvider, network: NetworkNameOnPriceProvider

  beforeEach(() => {
    ethPrice = '1980.861883676755965'
    asset = SupportedAssetPriceProvider.ETH
    network = 'eth'
  })

  describe('SINGLE network', () => {
    const priceCache = new PriceCache({
      pricer: {
        useMultichain: false,
        cleanupIntervalSec: 1,
      },
    } as Config)
    let expectedResult: PriceCacheSingleNetwork

    beforeEach(() => {
      // refresh the maps before each test, cuz it's used in multiple tests
      priceCache.clean()
      expectedResult = new Map<SupportedAssetPriceProvider, string>()
    })

    it('should get "undefined" from cache', async () => {
      const result = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(result).to.equal(undefined)
    })

    it('should set price in cache', async () => {
      const result = priceCache.set(asset, network, ethPrice)
      expectedResult.set(asset, ethPrice)

      expect(result).to.deep.equal(expectedResult)
    })

    it('should get price from cache', async () => {
      priceCache.set(asset, network, ethPrice)
      const result = await priceCache.get(asset, network, {} as AssetAndAddress)

      expect(result).to.equal(ethPrice)
    })

    it('should update price in cache', async () => {
      const emptyPrice = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(emptyPrice).to.equal(undefined)

      priceCache.set(asset, network, ethPrice)
      const firstPrice = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(firstPrice).to.equal(ethPrice)

      const newEthPrice = '2180.000083676755965'
      priceCache.set(asset, network, newEthPrice)
      const resultUpdated = await priceCache.get(asset, network, {} as AssetAndAddress)

      expect(resultUpdated).to.equal(newEthPrice)
    })

    it('should clean the cache on interval', () => {
      // set some entries and verify them
      priceCache.set(asset, network, ethPrice)
      const wholeCache = priceCache.getWholeCache()
      expect(wholeCache.size).to.equal(1)

      // init cleanup
      priceCache.initCleanup()
      // wait for 1.5 sec (the cleanup interval is set to 1 sec)
      setTimeout(() => {
        const wholeCache = priceCache.getWholeCache()
        expect(wholeCache.size).to.equal(0)
      }, 1.5 * 1000)
    })
  })

  describe('MULTI network', () => {
    const priceCache = new PriceCache({
      pricer: {
        useMultichain: true,
        cleanupIntervalSec: 1,
      },
    } as Config)
    let expectedMultiNtwkMap: PriceCacheMultiNetwork
    let expectedInnerMap: NetworkToPriceMap

    beforeEach(() => {
      // refresh the maps before each test, cuz it's used in multiple tests
      priceCache.clean()
      expectedMultiNtwkMap = new Map<SupportedAssetPriceProvider, Map<NetworkNameOnPriceProvider, string>>()
      expectedInnerMap = new Map<NetworkNameOnPriceProvider, string>()
    })

    it('should get "undefined" from cache', async () => {
      const result = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(result).to.equal(undefined)
    })

    it('should set price in cache', async () => {
      const result = priceCache.set(asset, network, ethPrice)
      expectedInnerMap.set(network, ethPrice)

      expect(result).to.deep.equal(expectedInnerMap)
    })

    it('should get price from cache', async () => {
      priceCache.set(asset, network, ethPrice)
      const result = await priceCache.get(asset, network, {} as AssetAndAddress)

      expect(result).to.equal(ethPrice)
    })

    it('should update price in cache', async () => {
      const emptyPrice = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(emptyPrice).to.equal(undefined)

      priceCache.set(asset, network, ethPrice)
      const firstPrice = await priceCache.get(asset, network, {} as AssetAndAddress)
      expect(firstPrice).to.equal(ethPrice)

      const newEthPrice = '2180.000083676755965'
      priceCache.set(asset, network, newEthPrice)
      const updatedPrice = await priceCache.get(asset, network, {} as AssetAndAddress)

      expect(updatedPrice).to.equal(newEthPrice)
    })

    it('should add new network and price to existing asset map, then update one of them', () => {
      const newEthPrice = '2222.111100002222333'
      const newNetwork: NetworkNameOnPriceProvider = 'bsc'
      // set expected test results
      expectedMultiNtwkMap.set(asset, new Map<NetworkNameOnPriceProvider, string>())
      expectedMultiNtwkMap.get(asset)?.set(network, ethPrice)
      expectedMultiNtwkMap.get(asset)?.set(newNetwork, newEthPrice)
      // populate real cache instance
      priceCache.set(asset, network, ethPrice)
      priceCache.set(asset, newNetwork, newEthPrice)

      const wholeCache = priceCache.getWholeCache()
      expect(wholeCache).to.deep.equal(expectedMultiNtwkMap)

      // reset and set expected test results
      const newEthPrice2 = '3333.111100002222333'
      expectedMultiNtwkMap = new Map<SupportedAssetPriceProvider, Map<NetworkNameOnPriceProvider, string>>()
      expectedMultiNtwkMap.set(asset, new Map<NetworkNameOnPriceProvider, string>())
      expectedMultiNtwkMap.get(asset)?.set(network, newEthPrice2)
      expectedMultiNtwkMap.get(asset)?.set(newNetwork, newEthPrice)
      // update real cache instance
      priceCache.set(asset, network, newEthPrice2)

      const wholeCacheUpdated = priceCache.getWholeCache()
      expect(wholeCache).to.deep.equal(expectedMultiNtwkMap)
    })

    it('should clean the cache on interval', () => {
      // set some entries and verify them
      priceCache.set(asset, network, ethPrice)
      const wholeCache = priceCache.getWholeCache()
      expect(wholeCache.size).to.equal(1)

      // init cleanup
      priceCache.initCleanup()
      // wait for 1.5 sec (the cleanup interval is set to 1 sec)
      setTimeout(() => {
        const wholeCache = priceCache.getWholeCache()
        expect(wholeCache.size).to.equal(0)
      }, 1.5 * 1000)
    })

    it('should parse the fake price to BigNumber', () => {
      const fakePriceNumber = 6000000000000000000

      const fakePrice = fakePriceNumber.toString()

      const fakePriceBigNumber = BigNumber.from(fakePrice)

      expect(fakePriceBigNumber.toString()).to.equal(fakePrice)
    })
  })
})
