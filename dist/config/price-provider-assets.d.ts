export type NetworkNameOnPriceProvider = 'arbitrum' | 'avalanche' | 'avalanche_fuji' | 'base' | 'bsc' | 'eth' | 'eth_goerli' | 'fantom' | 'flare' | 'gnosis' | 'linea' | 'optimism' | 'optimism_testnet' | 'polygon' | 'polygon_mumbai' | 'polygon_zkevm' | 'rollux' | 'scroll' | 'syscoin';
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
