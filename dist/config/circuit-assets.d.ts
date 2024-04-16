import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from './price-provider-assets';
export declare type NetworkNameOnCircuit = 'base' | 'arbm' | 'bscm' | 'opti' | 'linm' | 'ethm' | 'bsct' | 'opsp' | 'bsgr' | 'bscp' | 'bssp' | 'scrt' | 'arbt' | 'sepl' | 'poly' | 'l0rn' | 'l1rn' | 'l3rn' | 't0rn' | 't2rn' | 't3rn' | 'line' | 'file' | 'blss' | 'blst';
export type NetworkNameCircuitToPriceProviderMap = {
    [key in NetworkNameOnCircuit]: NetworkNameOnPriceProvider;
};
export declare enum SupportedAssetCircuit {
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
    BRN = 3343
}
export type AssetNameCircuitToPriceProvider = {
    [key in number]: SupportedAssetPriceProvider;
};
export declare const networkNameCircuitToPriceProvider: NetworkNameCircuitToPriceProviderMap;
export declare const assetNameCircuitToPriceProvider: AssetNameCircuitToPriceProvider;
