import { NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from './price-provider-assets';
import { Config } from './config';
import { BigNumber, Wallet, Contract } from 'ethers';
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
export declare function mapSymbolToCurrency(asset: number): string;
export declare class AssetMapper {
    private static instance;
    private readonly config;
    private constructor();
    static getInstance(_config: Config): AssetMapper;
    static getAssetId(asset: SupportedAssetPriceProvider): number;
    static fakePriceOfAsset(amount: number, asset: SupportedAssetPriceProvider): number;
    static fakePriceOfVendorAsset(amount: number, assetA: number, assetB: number): number;
    checkAssetBalance<T>(wallet: Wallet, asset: number, networkId: NetworkNameOnCircuit, initContract: (contractName: any, address: string, signer: any) => Contract, ContractName: any): Promise<BigNumber>;
    mapAssetByAddress(targetNetworkId: NetworkNameOnCircuit, assetAddress: string): SupportedAssetPriceProvider;
    getAddressOnTarget4BByCircuitAssetNumber(targetNetworkId: NetworkNameOnCircuit, asset: number): string;
}
