import { BigNumber } from 'ethers';
import { AssetAndAddress, NetworkNameOnPriceProvider, SupportedAssetPriceProvider } from '../config/price-provider-assets';
import { Order } from '../types';
import { CostResult, DealPublishability, OrderProfitability, OrderProfitabilityProposalForSetAmount, PriceResult, UserPublishStrategy } from './types';
import { Config } from '../config/config';
import { PriceCache } from './price-cache';
export interface OrderArbitrageStrategy {
    minProfitPerOrder: BigNumber;
    minProfitRate: number;
    maxAmountPerOrder: BigNumber;
    minAmountPerOrder: BigNumber;
    maxShareOfMyBalancePerOrder: number;
}
export declare const ERC20_GAS_LIMIT: BigNumber;
export declare const ETH_TRANSFER_GAS_LIMIT: BigNumber;
export declare class Pricer {
    private readonly config;
    private readonly ankr;
    readonly priceCache: PriceCache;
    constructor(_config: Config);
    receiveAssetUSDValue(asset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider, amount: BigNumber): Promise<number>;
    retrieveAssetPricing(assetA: SupportedAssetPriceProvider, assetB: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider): Promise<PriceResult>;
    retrieveCostInAsset(asset: SupportedAssetPriceProvider, destinationAsset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider, estGasPriceOnNativeInWei: BigNumber, ofTokenTransfer: string): Promise<CostResult>;
    floatToBigIntString(value: number): string;
    floatToBigNum(value: number): BigNumber;
    /**
     * Implement logic on evaluating the order's profitability based on selected by the user / executor strategy
     * For executor - choose Order-based Arbitrage strategy
     * For user - choose external sources price compare strategy
     *
     * @param {BigNumber} balance Balance of the executor designated in destination asset
     * @param {CostResult}  costOfExecutionOnDestination  Cost designated in destination asset
     * @param {OrderArbitrageStrategy}  strategy
     * @param {Order}  order
     * @param {PriceResult} pricing
     *
     * @return {OrderProfitability}
     */
    evaluateDeal(balance: BigNumber, costOfExecutionOnDestination: CostResult, strategy: OrderArbitrageStrategy, order: Order, pricing: PriceResult): OrderProfitability;
    assessDealForPublication(userBalance: BigNumber, estimatedCostOfExecution: CostResult, userStrategy: UserPublishStrategy, marketPricing: PriceResult, overpayOption: 'slow' | 'regular' | 'fast' | 'custom', slippageOption: 'zero' | 'regular' | 'high' | 'custom', customOverpayRatio?: number, customSlippage?: number): DealPublishability;
    proposeDealForSetAmount(balance: BigNumber, costOfExecutionOnDestination: CostResult, strategy: OrderArbitrageStrategy, order: Order, pricing: PriceResult): OrderProfitabilityProposalForSetAmount;
    /**
     * Parse the given price string as float with decimal precision
     *
     * @param {BigNumber} price
     * @return {number}
     */
    static priceAsFloat(price: BigNumber): number;
    /**
     * This function calculates the price of asset A in terms of asset B, and ensures that the result
     * always has a fractional part of exactly 18 decimals.
     *
     * @param {BigNumber} priceA
     * @param {BigNumber} priceB
     * @return {BigNumber}
     */
    calculatePriceAinBOn18Decimals(priceA: BigNumber, priceB: BigNumber): BigNumber;
    /**
     * This function takes a string representation of a price and converts it into a BigNumber format,
     * ensuring that the fractional part is extended or truncated to exactly 18 decimals.
     *
     * @param {string} priceCached
     * @return {BigNumber}
     */
    parsePriceStringToBigNumberOn18Decimals(priceCached: string): BigNumber;
    /**
     * Fetches the USD price of the given asset on the given blockchain and stores it
     * in the local price cache
     *
     * @param {AssetAndAddress}            assetObj
     * @param {NetworkNameOnPriceProvider} network
     * @return {Promise<string>}
     */
    fetchPriceAndStoreInCache(assetObj: AssetAndAddress, network: NetworkNameOnPriceProvider): Promise<string>;
    receiveAssetPriceWithCache(asset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider): Promise<BigNumber>;
    calculatePricingAssetAinB(assetA: SupportedAssetPriceProvider, assetB: SupportedAssetPriceProvider, priceA: BigNumber, priceB: BigNumber, destinationNetwork: NetworkNameOnPriceProvider): PriceResult;
    calculateCostInAsset(asset: string, priceAsset: BigNumber, priceNative: BigNumber, estGasPriceOnNativeInWei: BigNumber, ofTokenTransfer: string): CostResult;
}
