import { BigNumber, ethers } from 'ethers'

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
  | 'blast'

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
  arbitrum: [
    {
      asset: 'arbitrum',
      address: ethers.constants.AddressZero,
      // address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    },
    //wETH
    {
      asset: 'eth',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    {
      asset: 'usdc',
      address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    },
    {
      asset: 'usdt',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    },
    {
      asset: 'dot',
      address: '0x4909C938CD2ce2A31adDbee9b469694549D8d0e1',
    },
    //usdt
    {
      asset: 'trn',
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    },
  ],
  base: [
    //wETH
    {
      asset: 'base',
      address: ethers.constants.AddressZero,
      // address: '0x4200000000000000000000000000000000000006',
    },
    //wETH
    {
      asset: 'eth',
      address: '0x4200000000000000000000000000000000000006',
    },
    {
      asset: 'usdc',
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    //USDT has no supply, using USDC
    {
      asset: 'usdt',
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    {
      asset: 'dai',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    },
    {
      asset: 'dot',
      address: '0x4a84F39b8A265DD2c39A3175B4fFD3731DD8FE17',
    },
    {
      asset: 'trn',
      address: '0xeECEC063D5ea592A49340437a8C59A624Fa79159',
    },
    {
      asset: 'brn',
      address: '0x548CD649Ccb2b6D99612A6b09020A52C868Acb1E',
    },
  ],
  bsc: [
    {
      asset: 'bnb',
      address: ethers.constants.AddressZero,
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
    //TODO: provider returns 0, using usdt
    {
      asset: 'optimism',
      address: '0x55d398326f99059ff775485246999027b3197955',
      // address: '0x170c84e3b1d282f9628229836086716141995200',
    },
    {
      asset: 'matic',
      address: '0xcc42724c6683b7e57334c4e856f4c9965ed682bd',
    },
    {
      asset: 'dot',
      address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
    },
    //usdt
    {
      asset: 'trn',
      address: '0x55d398326f99059ff775485246999027b3197955',
    },
  ],
  //not supported on provider - networkNameCircuitToPriceProvider will use 'base' instead
  blast: [
    {
      asset: 'eth',
      address: ethers.constants.AddressZero,
    },
    {
      asset: 'brn',
      address: '0xfF3f18A66bB4Bd68079b93f70F7F7bE752986Ce8',
    },
    {
      asset: 'btc',
      address: '0x33a18971F394e4Ac070617eCce91042917821A0D',
    },
    {
      asset: 'dot',
      address: '0x8d4D970c84f3E25d2243bB9d8DBc14D5eE29796f',
    },
    {
      asset: 'sol',
      address: '0xc5FA850A529509e568e286D261d3994705D7Aab0',
    },
    {
      asset: 'usdt',
      address: '0xE5173BD21bdF0ad9d7dF32b044aD8BDba7cFe5E3',
    },
    {
      asset: 'usdc',
      address: '0xE5173BD21bdF0ad9d7dF32b044aD8BDba7cFe5E3',
    },
    {
      asset: 'trn',
      address: '0x2Ee8d484eAad28427cc9938DbC4Cd438C1cC095d',
    },
  ],
  //not supported on provider and not used
  file: [
    {
      asset: 'optimism',
      address: ethers.constants.AddressZero,
      // address: '0x4200000000000000000000000000000000000042',
    },
    {
      asset: 'eth',
      address: ethers.constants.AddressZero,
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
    {
      asset: 'dot',
      address: '0x93aB601aCa2758793a604DDb867BAc4FD91786Da',
    },
    {
      asset: 'trn',
      address: '0x065D70B9ea0288f071F8501C47d51D9f37F47969',
    },
    {
      asset: 'brn',
      address: '0xa8F287C6c26258fE52ea94576518076Ff7044010',
    },
  ],
  //not supported on provider, networkNameCircuitToPriceProvider will use 'arbitrum' instead
  l0rn: [
    {
      asset: 'eth',
      address: ethers.constants.AddressZero,
    },
    {
      asset: 'dot',
      address: '0x4b227b3c6AE905D97CdfB765afe8b23D5154b81c',
    },
    {
      asset: 'trn',
      address: '0xd2fe5faA6269A6bbB17AEA9800B7e59Bb0CadAec',
    },
  ],
  linea: [
    {
      // wETH
      asset: 'eth',
      address: ethers.constants.AddressZero,
      // address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    },
    {
      asset: 'usdc',
      address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
    },
    {
      asset: 'usdt',
      address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    },
    {
      asset: 'dot',
      address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    },
    //usdt
    {
      asset: 'trn',
      address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    },
  ],
  optimism: [
    {
      asset: 'optimism',
      address: ethers.constants.AddressZero,
      // address: '0x4200000000000000000000000000000000000042',
    },
    //wETH
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
    //no supply, using usdt
    {
      asset: 'matic',
      address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      // address: '0xe211233fe8b6964208cfc7ca66df9c0340088670',
    },
    {
      asset: 'dot',
      address: '0x93aB601aCa2758793a604DDb867BAc4FD91786Da',
    },
    {
      asset: 'trn',
      address: '0x065D70B9ea0288f071F8501C47d51D9f37F47969',
    },
    {
      asset: 'brn',
      address: '0xa8F287C6c26258fE52ea94576518076Ff7044010',
    },
  ],
  scroll: [
    //wETH
    {
      asset: 'eth',
      address: ethers.constants.AddressZero,
      // address: '0x5300000000000000000000000000000000000004',
    },
    {
      asset: 'usdc',
      address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
    },
    {
      asset: 'usdt',
      address: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
    },
    {
      asset: 'dot',
      address: '0x39c36E69BC4fA97a7380de21d6EF88377F7822ad',
    },
    //usdt
    {
      asset: 'trn',
      address: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
    },
  ],
  eth: [
    //wETH
    {
      asset: 'eth',
      address: ethers.constants.AddressZero,
      // address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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
      asset: 'dot',
      address: '0xe56AC558178c4a71AEa3E542Ff4bDD131B5fCE54',
    },
    //usdt
    {
      asset: 'trn',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
  ],
  polygon: [
    {
      asset: 'matic',
      address: ethers.constants.AddressZero,
      // address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    //wETH
    {
      asset: 'eth',
      address: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    },
    {
      asset: 'usdc',
      address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
    },
    {
      asset: 'usdt',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
    //usdt
    {
      asset: 'trn',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
  ],
  avalanche_fuji: [],
  avalanche: [],
  fantom: [],
  syscoin: [],
  flare: [],
  gnosis: [],
  polygon_mumbai: [],
  polygon_zkevm: [],
  rollux: [],
  eth_goerli: [],
  optimism_testnet: [],
  //not supported on provider - networkNameCircuitToPriceProvider will use 'polygon' instead
  t0rn: [
    {
      asset: 'dot',
      address: '0x9D0685F859782B4bC3f0E4403bEeF11eDA8AC2E8',
    },
    {
      asset: 'trn',
      address: '0x77F19d3cE6698B6F36084442A806d0A7C3Aa2732',
    },
  ],
  t2rn: [],
  filecoin: [],
} as const

// @ts-ignore
export const networkToAssetAddressOnPriceProviderMap: NetworkToAssetAddressOnPriceProviderMap = defaultNetworkData
