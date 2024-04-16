import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from './price-provider-assets'

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
