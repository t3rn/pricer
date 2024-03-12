import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from './price-provider-assets';
export declare type NetworkNameOnCircuit = 'bsct' | 'opsp' | 'bsgr' | 'bscp' | 'bssp' | 'scrt' | 'arbt' | 'sepl' | 'poly' | 't0rn' | 'l0rn' | 't2rn' | 't3rn' | 'line' | 'file';
export type NetworkNameCircuitToPriceProviderMap = {
    [key in NetworkNameOnCircuit]: NetworkNameOnPriceProvider;
};
export type AssetNameCircuitToPriceProvider = {
    [key in number]: SupportedAssetPriceProvider;
};
export declare const networkNameCircuitToPriceProvider: NetworkNameCircuitToPriceProviderMap;
export declare class AssetMapper {
    static fakePriceOfAsset(amount: number, asset: SupportedAssetPriceProvider): number;
}
