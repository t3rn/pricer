import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from './price-provider-assets'

export declare type NetworkNameOnCircuit =
  | 'bsct'
  | 'opsp'
  | 'bsgr'
  | 'bscp'
  | 'bssp'
  | 'scrt'
  | 'arbt'
  | 'sepl'
  | 'poly'
  | 't0rn'
  | 't2rn'
  | 't3rn'
  | 'line'
  | 'file'

export type NetworkNameCircuitToPriceProviderMap = {
  [key in NetworkNameOnCircuit]: NetworkNameOnPriceProvider
}

export type AssetNameCircuitToPriceProvider = {
  [key in number]: SupportedAssetPriceProvider
}

export const networkNameCircuitToPriceProvider = {
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
} as NetworkNameCircuitToPriceProviderMap

export class AssetMapper {
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
}
