import { BigNumber } from 'ethers';
export type NetworkNameOnPriceProvider = 'arbitrum' | 'avalanche' | 'avalanche_fuji' | 'base' | 'bsc' | 'eth' | 'eth_goerli' | 'fantom' | 'flare' | 'gnosis' | 'linea' | 'optimism' | 'optimism_testnet' | 'polygon' | 'polygon_mumbai' | 'polygon_zkevm' | 'rollux' | 'scroll' | 'syscoin' | 'blast';
export interface AssetAndAddress {
    asset: SupportedAssetPriceProvider;
    address: string;
    network: NetworkNameOnPriceProvider;
}
export interface AssetAndAddressExtended {
    assetObject: AssetAndAddress | BigNumber;
    isFakePrice: boolean;
    foundInRequestedNetwork?: boolean;
    foundNetwork?: NetworkNameOnPriceProvider;
}
export type NetworkToAssetAddressOnPriceProviderMap = {
    [key in NetworkNameOnPriceProvider]: Array<AssetAndAddress>;
};
export declare enum SupportedAssetPriceProvider {
    ETH = "eth",
    BTC = "btc",
    SOL = "sol",
    FIL = "filecoin",
    DAI = "dai",
    USDC = "usdc",
    USDT = "usdt",
    T3USD = "usdt",
    MATIC = "matic",
    OPTIMISM = "optimism",
    BASE = "base",
    SCROLL = "scroll",
    ARBITRUM = "arbitrum",
    BSC = "bsc",
    BNB = "bsc",
    TRN = "trn",
    BRN = "brn",
    DOT = "dot",
    UNKNOWN = "unknown"
}
export declare enum t3rnVendorAsset {
    BTC = "t3BTC",
    SOL = "t3SOL",
    DOT = "t3DOT",
    USD = "t3USD",
    TRN = "TRN",
    BRN = "BRN"
}
export declare const mapSupportedAssetPriceProviderToT3rnVendorAssets: (assetName: SupportedAssetPriceProvider) => t3rnVendorAsset;
export declare const mapT3rnVendorAssetsToSupportedAssetPrice: (tokenName: string) => SupportedAssetPriceProvider;
export declare const networkToAssetAddressOnPriceProviderMap: NetworkToAssetAddressOnPriceProviderMap;
