import { BigNumber } from 'ethers'

export type NetworkNameOnPriceProvider =
  | 'arbitrum'
  | 'avalanche'
  | 'avalanche_fuji'
  | 'base'
  | 'bsc'
  | 'eth'
  | 'eth_goerli'
  | 'fantom'
  | 'flare'
  | 'gnosis'
  | 'linea'
  | 'optimism'
  | 'optimism_testnet'
  | 'polygon'
  | 'polygon_mumbai'
  | 'polygon_zkevm'
  | 'rollux'
  | 'scroll'
  | 'syscoin'

export interface AssetAndAddress {
  asset: SupportedAssetPriceProvider
  address: string
  network: NetworkNameOnPriceProvider
}

export interface AssetAndAddressExtended {
  assetObject: AssetAndAddress | BigNumber
  isFakePrice: boolean
  foundInRequestedNetwork?: boolean
  foundNetwork?: NetworkNameOnPriceProvider
}

export type NetworkToAssetAddressOnPriceProviderMap = {
  [key in NetworkNameOnPriceProvider]: Array<AssetAndAddress>
}

export enum SupportedAssetPriceProvider {
  ETH = 'eth',
  BTC = 'btc',
  SOL = 'sol',
  FIL = 'filecoin',
  DAI = 'dai',
  USDC = 'usdc',
  USDT = 'usdt',
  T3USD = 'usdt',
  MATIC = 'matic',
  OPTIMISM = 'optimism',
  BASE = 'base',
  SCROLL = 'scroll',
  ARBITRUM = 'arbitrum',
  BSC = 'bsc',
  BNB = 'bsc',
  TRN = 'trn',
  BRN = 'brn',
  DOT = 'dot',
  UNKNOWN = 'unknown',
}

export enum t3rnVendorAsset {
  BTC = 't3BTC',
  SOL = 't3SOL',
  DOT = 't3DOT',
  USD = 't3USD',
  TRN = 'TRN',
  BRN = 'BRN',
}

export const mapSupportedAssetPriceProviderToT3rnVendorAssets = (
  assetName: SupportedAssetPriceProvider,
): t3rnVendorAsset => {
  switch (assetName) {
    case SupportedAssetPriceProvider.BTC:
      return t3rnVendorAsset.BTC
    case SupportedAssetPriceProvider.SOL:
      return t3rnVendorAsset.SOL
    case SupportedAssetPriceProvider.DOT:
      return t3rnVendorAsset.DOT
    case SupportedAssetPriceProvider.T3USD:
      return t3rnVendorAsset.USD
    case SupportedAssetPriceProvider.TRN:
      return t3rnVendorAsset.TRN
    case SupportedAssetPriceProvider.BRN:
      return t3rnVendorAsset.BRN
    default:
      throw new Error(`Asset ${assetName} not supported`)
  }
}

export const mapT3rnVendorAssetsToSupportedAssetPrice = (tokenName: string): SupportedAssetPriceProvider => {
  switch (tokenName.toLowerCase()) {
    case t3rnVendorAsset.BTC.toLowerCase():
      return SupportedAssetPriceProvider.BTC
    case t3rnVendorAsset.DOT.toLowerCase():
      return SupportedAssetPriceProvider.DOT
    case t3rnVendorAsset.SOL.toLowerCase():
      return SupportedAssetPriceProvider.SOL
    case t3rnVendorAsset.USD.toLowerCase():
    case t3rnVendorAsset.TRN.toLowerCase():
    case t3rnVendorAsset.BRN.toLowerCase():
      return SupportedAssetPriceProvider.USDT
    default:
      throw new Error(`Asset ${tokenName} not supported`)
  }
}

const defaultNetworkData = {
  eth: [
    {
      asset: 'eth',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'usdc',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      asset: 'usdt',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
    {
      asset: 'matic',
      address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    },
    {
      asset: 'arbitrum',
      address: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
    },
    {
      asset: 'optimism',
      address: '0x4200000000000000000000000000000000000042',
    },
  ],
  base: [
    {
      asset: 'base',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'eth',
      address: '0x4200000000000000000000000000000000000006',
    },
    {
      asset: 'usdc',
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
  ],
  scroll: [
    {
      asset: 'scroll',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'eth',
      address: '0x5300000000000000000000000000000000000004',
    },
    {
      asset: 'usdc',
      address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
    },
    {
      asset: 'usdt',
      address: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
    },
  ],
  arbitrum: [
    {
      asset: 'arbitrum',
      address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    },
    {
      asset: 'eth',
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    },
    {
      asset: 'usdc',
      address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    },
    {
      asset: 'usdt',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    },
  ],
  bsc: [
    {
      asset: 'bsc',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'eth',
      address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    },
    {
      asset: 'usdc',
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    },
    {
      asset: 'usdt',
      address: '0x55d398326f99059ff775485246999027b3197955',
    },
    {
      asset: 'arbitrum',
      address: '0xa050ffb3eeb8200eeb7f61ce34ff644420fd3522',
    },
    {
      asset: 'optimism',
      address: '0x170c84e3b1d282f9628229836086716141995200',
    },
    {
      asset: 'matic',
      address: '0xcc42724c6683b7e57334c4e856f4c9965ed682bd',
    },
    // TODO: this is wrapped DOT
    // check this out: https://support.polkadot.network/support/solutions/articles/65000169207-what-is-the-contract-address-of-polkadot-
    {
      asset: 'dot',
      address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
    },
  ],
  polygon: [
    {
      asset: 'matic',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    {
      asset: 'eth',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'usdc',
      address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
    },
    {
      asset: 'usdt',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
  ],
  optimism: [
    {
      asset: 'optimism',
      address: '0x4200000000000000000000000000000000000042',
    },
    // TODO: this is wrapped ETH
    {
      asset: 'eth',
      address: '0x4200000000000000000000000000000000000006',
    },
    {
      asset: 'usdc',
      address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    },
    {
      asset: 'usdt',
      address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    },
    {
      asset: 'matic',
      address: '0xe211233fe8b6964208cfc7ca66df9c0340088670',
    },
  ],
  file: [
    {
      asset: 'optimism',
      address: '0x4200000000000000000000000000000000000042',
    },
    {
      asset: 'eth',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'usdc',
      address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    },
    {
      asset: 'usdt',
      address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    },
    {
      asset: 'matic',
      address: '0xe211233fe8b6964208cfc7ca66df9c0340088670',
    },
  ],
  avalanche_fuji: [],
  avalanche: [],
  fantom: [],
  syscoin: [],
  flare: [],
  gnosis: [],
  linea: [
    {
      asset: 'eth',
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: 'usdt',
      address: '0x1990bc6dfe2ef605bfc08f5a23564db75642ad73',
    },
  ],
  polygon_mumbai: [],
  polygon_zkevm: [],
  rollux: [],
  eth_goerli: [],
  optimism_testnet: [],
  t0rn: [],
  t2rn: [],
  l0rn: [
    {
      asset: 'eth',
      address: '0x0000000000000000000000000000000000000000',
    },
  ],
  filecoin: [],
} as const

// @ts-ignore
export const networkToAssetAddressOnPriceProviderMap: NetworkToAssetAddressOnPriceProviderMap = defaultNetworkData
