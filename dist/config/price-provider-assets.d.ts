import { Blockchain } from '@ankr.com/ankr.js';
export type NetworkNameOnPriceProvider = Blockchain;
export interface AssetAndAddress {
    asset: SupportedAssetPriceProvider;
    address: string;
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
    TRN = "t3rn",
    BRN = "t1rn",
    DOT = "dot",
    UNKNOWN = "unknown"
}
export declare const networkToAssetAddressOnPriceProviderMap: NetworkToAssetAddressOnPriceProviderMap;
