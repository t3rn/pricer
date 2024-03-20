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
/**
 * Represents a utility for pricing assets, evaluating orders, and assessing deals for profitability.
 */
export declare class Pricer {
    private readonly config;
    private ethersProvider;
    readonly priceCache: PriceCache;
    /**
     * Initializes a new instance of the Pricer class with the specified configuration.
     *
     * @param _config Configuration settings including provider URLs and token configurations.
     */
    constructor(_config: Config, _ethersProvider?: undefined);
    /**
     * Retrieves the USD value of a specified amount of an asset.
     *
     * @param asset The asset for which to retrieve the price.
     * @param destinationNetwork The network on which the asset is located.
     * @param amount The amount of the asset.
     * @return The value of the specified amount of the asset in USD.
     */
    receiveAssetUSDValue(asset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider, amount: BigNumber): Promise<number>;
    /**
     * Retrieves pricing information for converting between two assets.
     *
     * @param assetA The first asset.
     * @param assetB The second asset, to which the first asset's price is being compared.
     * @param destinationNetwork The network on which the assets are located.
     * @return An object containing the price of assetA in terms of assetB.
     */
    retrieveAssetPricing(assetA: SupportedAssetPriceProvider, assetB: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider): Promise<PriceResult>;
    /**
     * Calculates the cost of executing a transaction in terms of a specified asset.
     *
     * @param asset The asset in which the cost is to be calculated.
     * @param destinationAsset The native asset of the network, used for calculating gas costs.
     * @param destinationNetwork The network on which the transaction will take place.
     * @param estGasPriceOnNativeInWei The estimated gas price in Wei.
     * @param ofTokenTransfer The address of the token being transferred, used to determine gas limits.
     * @return The cost of the transaction in the specified asset.
     */
    retrieveCostInAsset(asset: SupportedAssetPriceProvider, destinationAsset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider, estGasPriceOnNativeInWei: BigNumber, ofTokenTransfer: string): Promise<CostResult>;
    floatToBigIntString(value: number): string;
    floatToBigNum(value: number): BigNumber;
    getAssetObject(asset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider): AssetAndAddress | BigNumber;
    /**
     * Evaluates the profitability of an order based on a given strategy.
     * Determines whether executing the order would result in a profit or loss.
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
    /**
     * Assesses the publishability of a deal based on user balance, estimated cost, and user-defined strategy.
     * Determines whether the deal can be published given the constraints.
     *
     * @param userBalance The balance of the user in the native asset.
     * @param estimatedCostOfExecution The estimated cost of executing the deal.
     * @param userStrategy The user's strategy for publishing deals.
     * @param marketPricing The current market pricing information for involved assets.
     * @param overpayOption User's preference for overpaying to expedite the deal.
     * @param slippageOption User's tolerance for price slippage in the deal.
     * @param customOverpayRatio Custom overpay ratio if the 'custom' option is selected.
     * @param customSlippage Custom slippage tolerance if the 'custom' option is selected.
     * @return An object indicating whether the deal is publishable and the maximum reward for the deal.
     */
    assessDealForPublication(userBalance: BigNumber, estimatedCostOfExecution: CostResult, userStrategy: UserPublishStrategy, marketPricing: PriceResult, overpayOption: 'slow' | 'regular' | 'fast' | 'custom', slippageOption: 'zero' | 'regular' | 'high' | 'custom', customOverpayRatio?: number, customSlippage?: number): DealPublishability;
    /**
     * Proposes a deal for a set amount of asset, evaluating its profitability and setting a maximum reward.
     *
     * @param balance The balance of the executor in the destination asset.
     * @param costOfExecutionOnDestination The estimated cost of executing the deal in the destination asset.
     * @param strategy The strategy for arbitrage or deal-making.
     * @param order The order for which the deal is being proposed.
     * @param pricing The current pricing information for the involved assets.
     * @return An object containing the proposed deal's profitability and reward.
     */
    proposeDealForSetAmount(balance: BigNumber, costOfExecutionOnDestination: CostResult, strategy: OrderArbitrageStrategy, order: Order, pricing: PriceResult): OrderProfitabilityProposalForSetAmount;
    /**
     * Estimates the amount of 'toAsset' the user will receive at the end of the transaction.
     *
     * @param fromAsset The asset being sent.
     * @param toAsset The asset to be received.
     * @param fromChain The network of the 'fromAsset'.
     * @param fromChainProvider The provider url for 'fromChain'.
     * @param toChain The network of the 'toAsset'.
     * @param maxReward The maximum reward the user is willing to offer, in wei.
     * @return The estimated amount of 'toAsset' the user will receive, in wei.
     */
    estimateReceivedAmount(fromAsset: SupportedAssetPriceProvider, toAsset: SupportedAssetPriceProvider, fromChain: NetworkNameOnPriceProvider, fromChainProvider: string, toChain: NetworkNameOnPriceProvider, maxRewardWei: BigNumber): Promise<BigNumber>;
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
    /**
     * Retrieves the current price of a given asset on a specified network, utilizing a cache to avoid unnecessary API calls.
     * If the price is not available in the cache, it attempts to fetch the price from an external provider and stores it in the cache.
     * If the asset is not found in the predefined map or fetching fails, it logs warnings/errors and may return a fake or zero price as a fallback.
     *
     * @param asset The asset for which the price is being retrieved.
     * @param destinationNetwork The network on which the asset price is to be fetched.
     * @return The price of the asset as a BigNumber. Returns a fake or zero price if the asset is not found or fetching fails.
     */
    receiveAssetPriceWithCache(asset: SupportedAssetPriceProvider, destinationNetwork: NetworkNameOnPriceProvider): Promise<BigNumber>;
    /**
     * Calculates the price of one asset in terms of another using their respective USD prices.
     * This method is useful for converting values between two different assets, taking into account their current market prices.
     *
     * @param assetA The first asset, whose price is to be expressed in terms of asset B.
     * @param assetB The second asset, which serves as the base for the price conversion.
     * @param priceA The current price of asset A in USD.
     * @param priceB The current price of asset B in USD.
     * @param destinationNetwork The network relevant to the price information, used for fetching price details from the cache.
     * @return An object containing the price of asset A in terms of asset B, along with their USD prices for reference.
     */
    calculatePricingAssetAinB(assetA: SupportedAssetPriceProvider, assetB: SupportedAssetPriceProvider, priceA: BigNumber, priceB: BigNumber, destinationNetwork: NetworkNameOnPriceProvider): Promise<PriceResult>;
    /**
     * Calculates the cost of executing a transaction with a given asset on the blockchain.
     * This method takes into account the estimated gas price and the gas limit for the transaction type (ETH transfer or ERC20 token transfer).
     * It then converts the cost from native currency (e.g., ETH) to the specified asset using the current market prices.
     *
     * @param asset The asset in which the cost is to be calculated.
     * @param priceAsset The current price of the specified asset in USD.
     * @param priceNative The current price of the native currency (e.g., ETH) in USD.
     * @param estGasPriceOnNativeInWei The estimated gas price for the transaction in Wei.
     * @param ofTokenTransfer The type of transaction (native currency transfer or ERC20 token transfer) to determine the gas limit.
     * @return An object containing the cost of the transaction in Wei, ETH, USD, and the specified asset.
     */
    calculateCostInAsset(asset: string, priceAsset: BigNumber, priceNative: BigNumber, estGasPriceOnNativeInWei: BigNumber, ofTokenTransfer: string): CostResult;
}
