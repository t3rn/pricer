import { Config } from '../config/config';
import { SupportedAssetPriceProvider } from '../config/price-provider-assets';
import { BigNumber, Contract } from 'ethers';
import { NetworkNameOnCircuit } from '../config/circuit-assets';
export declare class AssetMapper {
    private static instance;
    private readonly config;
    private constructor();
    static getInstance(_config: Config): AssetMapper;
    getSupportedAssetsForNetwork(networkId: NetworkNameOnCircuit): SupportedAssetPriceProvider[];
    static getAssetId(asset: SupportedAssetPriceProvider): number;
    static fakePriceOfAsset(amount: number, asset: SupportedAssetPriceProvider): number;
    static fakePriceOfVendorAsset(amount: number, assetA: number, assetB: number): number;
    checkAssetBalance<T>(walletAddress: string, asset: number, networkId: NetworkNameOnCircuit, assetContract: Contract): Promise<BigNumber>;
    mapAssetByAddress(networkId: NetworkNameOnCircuit, assetAddress: string): SupportedAssetPriceProvider;
    getAddressOnTarget4BByCircuitAssetNumber(networkId: NetworkNameOnCircuit, asset: number): string;
}
