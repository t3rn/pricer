import {
  AssetAndAddress,
  NetworkNameOnPriceProvider,
  networkToAssetAddressOnPriceProviderMap,
  SupportedAssetPriceProvider,
} from './price-provider-assets'
import { logger } from '../utils/logger'
import { Config } from './config'
import { BigNumber, Contract, ethers } from 'ethers'

export declare type NetworkNameOnCircuit =
  | 'base'
  | 'arbm'
  | 'bscm'
  | 'opti'
  | 'linm'
  | 'ethm'
  | 'bsct'
  | 'opsp'
  | 'bsgr'
  | 'bscp'
  | 'bssp'
  | 'scrt'
  | 'arbt'
  | 'sepl'
  | 'poly'
  | 'l0rn'
  | 'l1rn'
  | 'l3rn'
  | 't0rn'
  | 't2rn'
  | 't3rn'
  | 'line'
  | 'file'
  | 'blss'
  | 'blst'

export type NetworkNameCircuitToPriceProviderMap = {
  [key in NetworkNameOnCircuit]: NetworkNameOnPriceProvider
}

export enum SupportedAssetCircuit {
  ETH = 0,
  BTC = 1,
  BNB = 2,
  SOL = 3,
  DOT = 100,
  USDC = 101,
  USDT = 102,
  DAI = 103,
  FIL = 199,
  T3USD = 104,
  TRN = 3333,
  BRN = 3343,
}

export type AssetNameCircuitToPriceProvider = {
  [key in number]: SupportedAssetPriceProvider
}

export const networkNameCircuitToPriceProvider = {
  ethm: 'eth',
  base: 'base',
  arbm: 'arbitrum',
  bscm: 'bsc',
  opti: 'optimism',
  linm: 'linea',
  bsct: 'bsc',
  opsp: 'optimism',
  bsgr: 'base',
  bscp: 'base',
  bssp: 'base',
  scrt: 'scroll',
  arbt: 'arbitrum',
  sepl: 'eth',
  poly: 'polygon',
  t0rn: 'polygon',
  l0rn: 'arbitrum',
  l1rn: 'arbitrum',
  l3rn: 'arbitrum',
  line: 'linea',
  blss: 'blast',
  blst: 'blast',
} as NetworkNameCircuitToPriceProviderMap

export const assetNameCircuitToPriceProvider = {
  0: SupportedAssetPriceProvider.ETH,
  1: SupportedAssetPriceProvider.BTC,
  2: SupportedAssetPriceProvider.BNB,
  3: SupportedAssetPriceProvider.SOL,
  100: SupportedAssetPriceProvider.DOT,
  101: SupportedAssetPriceProvider.USDC,
  102: SupportedAssetPriceProvider.USDT,
  103: SupportedAssetPriceProvider.DAI,
  199: SupportedAssetPriceProvider.FIL,
  104: SupportedAssetPriceProvider.T3USD,
  3333: SupportedAssetPriceProvider.TRN,
  3343: SupportedAssetPriceProvider.BRN,
} as AssetNameCircuitToPriceProvider

export function mapSymbolToCurrency(asset: number): string {
  const priceProvider = assetNameCircuitToPriceProvider[asset]
  return SupportedAssetPriceProvider[
    priceProvider.toUpperCase() as unknown as keyof typeof SupportedAssetPriceProvider
  ].toUpperCase()
}

export class AssetMapper {
  private static instance: AssetMapper
  private readonly config: Config

  private constructor(_config: Config) {
    this.config = _config
  }

  public static getInstance(_config: Config): AssetMapper {
    if (!this.instance) {
      this.instance = new AssetMapper(_config)
    }
    return this.instance
  }

  public getSupportedAssetsForNetwork(networkId: NetworkNameOnCircuit): SupportedAssetPriceProvider[] {
    const networkName = networkNameCircuitToPriceProvider[networkId]
    const assetsAndAddresses = networkToAssetAddressOnPriceProviderMap[networkName]

    if (!assetsAndAddresses) {
      logger.warn(`No assets configured for network: ${networkName}`)
      return []
    }

    return assetsAndAddresses.map((assetAndAddress) => assetAndAddress.asset)
  }

  public static getAssetId(asset: SupportedAssetPriceProvider): number {
    for (const [assetIdString, _asset] of Object.entries(assetNameCircuitToPriceProvider)) {
      if (_asset === asset) {
        return parseInt(assetIdString)
      }
    }

    return 0
  }

  public static fakePriceOfAsset(amount: number, asset: SupportedAssetPriceProvider): number {
    switch (asset) {
      case SupportedAssetPriceProvider.TRN:
        return amount * 2
      case SupportedAssetPriceProvider.BRN:
        return amount / 10
      case SupportedAssetPriceProvider.BTC:
        return amount * 40000
      case SupportedAssetPriceProvider.ETH:
        return amount * 2000
      case SupportedAssetPriceProvider.BNB:
        return amount * 400
      case SupportedAssetPriceProvider.SOL:
        return amount * 100
      case SupportedAssetPriceProvider.DOT:
        return amount * 6
      case SupportedAssetPriceProvider.USDC:
        return amount
      case SupportedAssetPriceProvider.USDT:
        return amount
      case SupportedAssetPriceProvider.DAI:
        return amount
      case SupportedAssetPriceProvider.FIL:
        return amount * 4
      case SupportedAssetPriceProvider.T3USD:
        return amount
      default:
        return 0
    }
  }

  public static fakePriceOfVendorAsset(amount: number, assetA: number, assetB: number): number {
    const assetNameA = assetNameCircuitToPriceProvider[assetA]
    const assetNameB = assetNameCircuitToPriceProvider[assetB]
    if (!assetNameA || !assetNameB) {
      throw new Error(`Asset ${assetA} or ${assetB} not found`)
    }
    const assetPriceA = AssetMapper.fakePriceOfAsset(amount, assetNameA)
    const assetPriceB = AssetMapper.fakePriceOfAsset(amount, assetNameB)

    return (assetPriceA / assetPriceB) * amount
  }

  public async checkAssetBalance<T>(
    walletAddress: string,
    asset: number,
    networkId: NetworkNameOnCircuit,
    assetContract: Contract,
  ): Promise<BigNumber> {
    const assetName = assetNameCircuitToPriceProvider[asset]
    const defaultAddress = ethers.constants.AddressZero

    if (!assetName) {
      logger.error(
        {
          asset,
          sourceNetwork: networkId,
          defaultAddress,
        },
        `🍑🚨 Asset not found in config. Return zero as balance`,
      )
      return BigNumber.from(0)
    }

    try {
      const assetAddress = this.getAddressOnTarget4BByCircuitAssetNumber(networkId, asset)
      if (assetAddress === defaultAddress) {
        logger.warn(
          {
            asset,
            assetName,
            sourceNetwork: networkId,
          },
          `🍑 Asset not found on network. Return zero as balance`,
        )
        return BigNumber.from(0)
      }

      return (await assetContract.balanceOf(walletAddress)) as BigNumber
    } catch (e) {
      logger.error(
        {
          asset,
          sourceNetwork: networkId,
          defaultAddress,
        },
        `🍑🚨 Asset address not found in config. Return zero as balance`,
      )
      return BigNumber.from(0)
    }
  }

  public mapAssetByAddress(targetNetworkId: NetworkNameOnCircuit, assetAddress: string): SupportedAssetPriceProvider {
    const networkName = networkNameCircuitToPriceProvider[targetNetworkId]

    const assetsForNetwork = networkToAssetAddressOnPriceProviderMap[networkName as NetworkNameOnPriceProvider]
    if (!Array.isArray(assetsForNetwork)) {
      const errorMessage = '🍑🚨 Network name on Circuit not mapped to price provider.'
      logger.error(
        {
          assetAddress,
          target: targetNetworkId,
          network: networkName,
        },
        errorMessage,
      )
      throw new Error(errorMessage)
    }
    const assetName = assetsForNetwork.find((assetAndAddress: AssetAndAddress) => {
      return assetAndAddress.address.toLowerCase() === assetAddress.toLowerCase()
    })?.asset

    if (assetName) {
      return assetName
    } else {
      const errorMessage = 'Asset address does not match any addresses in the provided mapping.'
      logger.error(
        {
          assetAddress,
          target: targetNetworkId,
          network: networkName,
        },
        `🍑🚨 ${errorMessage}`,
      )
      throw new Error(errorMessage)
    }
  }

  public getAddressOnTarget4BByCircuitAssetNumber(targetNetworkId: NetworkNameOnCircuit, asset: number): string {
    const networkName = networkNameCircuitToPriceProvider[targetNetworkId]
    const assetName = assetNameCircuitToPriceProvider[asset]

    if (!assetName) {
      const errorMessage = 'Asset not mapped to a known asset name.'
      logger.error(
        {
          asset,
          targetNetworkId,
        },
        `🍑🚨 ${errorMessage}`,
      )
      throw new Error(errorMessage)
    }

    if (!Array.isArray(networkToAssetAddressOnPriceProviderMap[networkName as NetworkNameOnPriceProvider])) {
      const errorMessage = '🍑🚨 NetworkToAssetAddressOnPriceProviderMap is not an array.'
      logger.error({ targetNetworkId, networkName }, errorMessage)
      throw new Error(errorMessage)
    }

    const assetAddressMapping = networkToAssetAddressOnPriceProviderMap[networkName as NetworkNameOnPriceProvider].find(
      (assetAndAddress) => assetAndAddress.asset === assetName,
    )

    if (assetAddressMapping && assetAddressMapping.address) {
      return assetAddressMapping.address
    } else {
      const errorMessage = '🍑🚨 Address not found in NetworkToAssetAddressOnPriceProviderMap mapping.'
      logger.error({ asset, assetName, targetNetworkId, networkName }, errorMessage)
      throw new Error(errorMessage)
    }
  }
}
