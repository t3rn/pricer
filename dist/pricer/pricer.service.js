"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pricer = exports.ETH_TRANSFER_GAS_LIMIT = exports.ERC20_GAS_LIMIT = void 0;
const ethers_1 = require("ethers");
const ankr_js_1 = require("@ankr.com/ankr.js");
const price_provider_assets_1 = require("../config/price-provider-assets");
const logger_1 = require("../utils/logger");
const price_cache_1 = require("./price-cache");
const circuit_assets_1 = require("../config/circuit-assets");
exports.ERC20_GAS_LIMIT = ethers_1.ethers.BigNumber.from(50000);
exports.ETH_TRANSFER_GAS_LIMIT = ethers_1.ethers.BigNumber.from(21000);
/**
 * Represents a utility for pricing assets, evaluating orders, and assessing deals for profitability.
 */
class Pricer {
    /**
     * Initializes a new instance of the Pricer class with the specified configuration.
     *
     * @param _config Configuration settings including provider URLs and token configurations.
     */
    constructor(_config, _ethersProvider = undefined) {
        this.config = _config;
        this.ankr = new ankr_js_1.AnkrProvider(this.config.pricer.providerUrl);
        this.priceCache = new price_cache_1.PriceCache(this.config);
        this.priceCache.initCleanup();
        this.ethersProvider = _ethersProvider;
    }
    /**
     * Retrieves the USD value of a specified amount of an asset.
     *
     * @param asset The asset for which to retrieve the price.
     * @param destinationNetwork The network on which the asset is located.
     * @param amount The amount of the asset.
     * @return The value of the specified amount of the asset in USD.
     */
    receiveAssetUSDValue(asset, destinationNetwork, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const price = yield this.receiveAssetPriceWithCache(asset, destinationNetwork);
            const valueOfAmountOfAssetInUSD = price.mul(amount).div(ethers_1.BigNumber.from(10).pow(this.config.tokens.maxDecimals18));
            return Pricer.priceAsFloat(valueOfAmountOfAssetInUSD);
        });
    }
    /**
     * Retrieves pricing information for converting between two assets.
     *
     * @param assetA The first asset.
     * @param assetB The second asset, to which the first asset's price is being compared.
     * @param destinationNetwork The network on which the assets are located.
     * @return An object containing the price of assetA in terms of assetB.
     */
    retrieveAssetPricing(assetA, assetB, destinationNetwork) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceA = yield this.receiveAssetPriceWithCache(assetA, destinationNetwork);
            const priceB = yield this.receiveAssetPriceWithCache(assetB, destinationNetwork);
            return this.calculatePricingAssetAinB(assetA, assetB, priceA, priceB, destinationNetwork);
        });
    }
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
    retrieveCostInAsset(asset, destinationAsset, destinationNetwork, estGasPriceOnNativeInWei, ofTokenTransfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceAsset = yield this.receiveAssetPriceWithCache(asset, destinationNetwork);
            const priceNative = yield this.receiveAssetPriceWithCache(destinationAsset, destinationNetwork);
            logger_1.logger.debug({
                asset,
                destinationAsset,
                destinationNetwork,
                priceAsset: priceAsset.toString(),
                priceNative: priceNative.toString(),
            }, '⚓️ Retrieved prices of assets');
            return this.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofTokenTransfer);
        });
    }
    // Converts a floating-point number to a string representation of a BigInt.
    floatToBigIntString(value) {
        const asBigInt = BigInt(value);
        return asBigInt.toString();
    }
    // Converts a floating-point number to a BigNumber.
    floatToBigNum(value) {
        return ethers_1.BigNumber.from(this.floatToBigIntString(value));
    }
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
    evaluateDeal(balance, costOfExecutionOnDestination, strategy, order, pricing) {
        const rewardInDestinationAsset = order.maxReward
            .mul(pricing.priceAinB)
            .div(ethers_1.BigNumber.from(10).pow(this.config.tokens.maxDecimals18));
        const potentialProfit = rewardInDestinationAsset.sub(costOfExecutionOnDestination.costInAsset).sub(order.amount);
        logger_1.logger.debug({
            id: order.id,
            balance: ethers_1.utils.formatEther(balance),
            amountToSpend: ethers_1.utils.formatEther(order.amount),
            rewardToReceive: ethers_1.utils.formatEther(order.maxReward),
            maxShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.maxAmountPerOrder),
            minShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.minAmountPerOrder),
            minProfitRate: ethers_1.utils.formatEther(strategy.minProfitPerOrder),
            potentialProfit: ethers_1.utils.formatEther(potentialProfit),
        }, '🍐 evaluateDeal::Entry - deal conditions before any checks');
        if (potentialProfit.lte(ethers_1.BigNumber.from(0))) {
            return {
                isProfitable: false,
                profit: ethers_1.BigNumber.from(0),
                loss: potentialProfit,
            };
        }
        let minProfitRateBaseline;
        let minProfitRateBaselineBN;
        let minProfitRateBaselineStr;
        let maxProfitRateBaseline;
        let maxProfitRateBaselineBN;
        try {
            minProfitRateBaseline = (parseFloat(strategy.minProfitRate.toString()) * parseFloat(balance.toString())) / 100;
            // Bignumber would fail for fixed point numbers
            minProfitRateBaseline = Math.floor(minProfitRateBaseline);
            maxProfitRateBaseline =
                (parseFloat(strategy.maxShareOfMyBalancePerOrder.toString()) * parseFloat(balance.toString())) / 100;
            maxProfitRateBaseline = Math.ceil(maxProfitRateBaseline);
            maxProfitRateBaselineBN = ethers_1.BigNumber.from(this.floatToBigIntString(maxProfitRateBaseline));
            minProfitRateBaselineBN = ethers_1.BigNumber.from(this.floatToBigIntString(minProfitRateBaseline));
            minProfitRateBaselineStr = ethers_1.utils.formatEther(minProfitRateBaselineBN);
        }
        catch (error) {
            logger_1.logger.warn({
                id: order.id,
                error,
                balance: ethers_1.utils.formatEther(balance),
                amountToSpend: ethers_1.utils.formatEther(order.amount),
                rewardToReceive: ethers_1.utils.formatEther(order.maxReward),
                maxShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.maxAmountPerOrder),
                minShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.minAmountPerOrder),
                minProfitRate: ethers_1.utils.formatEther(strategy.minProfitPerOrder),
            }, '🍐 evaluateDeal::Failed to calculate minProfitRateBaseline or maxProfitRateBaseline; return as not profitable');
            return {
                isProfitable: false,
                profit: ethers_1.BigNumber.from(0),
                loss: potentialProfit,
            };
        }
        const isProfitAboveMinProfitRate = potentialProfit.gte(minProfitRateBaselineBN);
        const isProfitBelowMaxProfitRate = potentialProfit.lte(maxProfitRateBaselineBN);
        const isAmountBelowMaxAmountPerOrder = order.amount.lte(strategy.maxAmountPerOrder);
        const isAmountAboveMinAmountPerOrder = order.amount.gte(strategy.minAmountPerOrder);
        const isProfitAboveMinProfitPerOrder = potentialProfit.gte(strategy.minProfitPerOrder);
        logger_1.logger.debug({
            id: order.id,
            minProfitRateBaselineStr,
            potentialProfit: ethers_1.utils.formatEther(potentialProfit),
            isProfitAboveMinProfitRate,
            isProfitBelowMaxProfitRate,
            isAmountBelowMaxAmountPerOrder,
            isAmountAboveMinAmountPerOrder,
            isProfitAboveMinProfitPerOrder,
        }, '🍐 evaluateDeal::isProfitable conditions');
        // Check if profit satisfies strategy constraints
        const isProfitable = isProfitAboveMinProfitRate &&
            isProfitBelowMaxProfitRate &&
            isProfitAboveMinProfitPerOrder &&
            isAmountBelowMaxAmountPerOrder &&
            isAmountAboveMinAmountPerOrder;
        return {
            isProfitable,
            profit: isProfitable ? potentialProfit : ethers_1.BigNumber.from(0),
            loss: isProfitable ? ethers_1.BigNumber.from(0) : potentialProfit,
        };
    }
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
    assessDealForPublication(userBalance, estimatedCostOfExecution, userStrategy, marketPricing, overpayOption, slippageOption, customOverpayRatio, customSlippage) {
        // Determine the overpay ratio based on the selected option
        let overpayRatio;
        switch (overpayOption) {
            case 'slow':
                overpayRatio = 1.05; // 5% overpay
                break;
            case 'regular':
                overpayRatio = 1.1; // 10% overpay
                break;
            case 'fast':
                overpayRatio = 1.2; // 20% overpay
                break;
            case 'custom':
                overpayRatio = customOverpayRatio || 1.0;
                break;
            default:
                overpayRatio = 1.0;
        }
        // Determine the slippage tolerance
        let slippageTolerance;
        switch (slippageOption) {
            case 'zero':
                slippageTolerance = 1.0; // No slippage
                break;
            case 'regular':
                slippageTolerance = 1.02; // 2% slippage
                break;
            case 'high':
                slippageTolerance = 1.05; // 5% slippage
                break;
            case 'custom':
                slippageTolerance = customSlippage || 1.0;
                break;
            default:
                slippageTolerance = 1.0;
        }
        // Function to calculate the scale factor based on decimal places
        const calculateScaleFactor = (value) => {
            const decimalPlaces = (value.toString().split('.')[1] || '').length;
            return Math.pow(10, decimalPlaces);
        };
        // Determine the maximum scale factor needed for both overpayRatio and slippageTolerance
        const overpayScaleFactor = calculateScaleFactor(overpayRatio);
        const slippageScaleFactor = calculateScaleFactor(slippageTolerance);
        // Convert overpayRatio and slippageTolerance to integer equivalents
        let overpayRatioInt = Math.floor(overpayRatio * overpayScaleFactor);
        let slippageToleranceInt = Math.floor(slippageTolerance * slippageScaleFactor);
        // Adjust maxReward calculation with overpay and slippage
        const adjustedCost = estimatedCostOfExecution.costInAsset.mul(overpayRatioInt).div(overpayScaleFactor); // Adjust for the first scaleFactor
        console.log(`overpayRatio: ${overpayRatio}, overpayRatioInt: ${overpayRatioInt}, overpayScaleFactor: ${overpayScaleFactor}`);
        console.log(`slippageTolerance: ${slippageTolerance}, slippageToleranceInt: ${slippageToleranceInt}, slippageScaleFactor: ${slippageScaleFactor}`);
        console.log(`adjustedCost: ${ethers_1.utils.formatEther(adjustedCost)}`);
        // Adjust marketPricing.priceAinB with slippage tolerance
        const adjustedPriceAinB = marketPricing.priceAinB.mul(slippageToleranceInt).div(slippageScaleFactor);
        console.log(`adjustedPriceAinB: ${ethers_1.utils.formatEther(adjustedPriceAinB)}`);
        // Calculate maxReward considering the adjusted cost and market pricing with slippage
        const maxReward = adjustedCost.add(adjustedPriceAinB);
        console.log(`userBalance: ${ethers_1.utils.formatEther(userBalance)}, maxReward: ${ethers_1.utils.formatEther(maxReward)}`);
        // Assess if the user's balance is sufficient for the maxReward
        if (userBalance.lt(maxReward)) {
            return {
                isPublishable: false,
                maxReward,
            };
        }
        console.log(`maxReward: ${ethers_1.utils.formatEther(maxReward)}`);
        // Consider user's strategy constraints (e.g., max spending limit)
        const isWithinStrategyLimits = maxReward.lte(userStrategy.maxSpendLimit);
        // Determine if the deal is publishable
        const isPublishable = isWithinStrategyLimits;
        return {
            isPublishable,
            maxReward: isPublishable ? maxReward : ethers_1.BigNumber.from(0),
        };
    }
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
    proposeDealForSetAmount(balance, costOfExecutionOnDestination, strategy, order, pricing) {
        const { isProfitable, profit, loss } = this.evaluateDeal(balance, costOfExecutionOnDestination, strategy, order, pricing);
        const proposedMaxReward = profit.add(costOfExecutionOnDestination.costInAsset).add(order.amount);
        return {
            profitability: {
                isProfitable,
                profit,
                loss,
            },
            assumedCost: costOfExecutionOnDestination,
            assumedPrice: pricing,
            rewardAsset: order.rewardAsset,
            orderAsset: order.assetAddress,
            costOverpaymentPercent: 0,
            setAmount: order.amount,
            proposedMaxReward,
        };
    }
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
    estimateReceivedAmount(fromAsset, toAsset, fromChain, fromChainProvider, toChain, maxRewardWei) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ethersProvider && !fromChainProvider) {
                throw new Error('No provider URL for the source network was provided.');
            }
            // Retrieve the pricing information for converting fromAsset to toAsset.
            const pricing = yield this.retrieveAssetPricing(fromAsset, toAsset, toChain);
            console.log(`Price of ${fromAsset} in terms of ${toAsset}: ${pricing.priceAinB.toString()}`);
            // Convert the maxReward from its Wei representation to the equivalent amount in toAsset, considering the current market price.
            const maxRewardInToAsset = maxRewardWei.mul(pricing.priceAinB).div(ethers_1.BigNumber.from(10).pow(18));
            console.log(`Equivalent ${toAsset} amount before subtracting transaction cost: ${maxRewardInToAsset.toString()}`);
            if (!this.ethersProvider) {
                this.ethersProvider = new ethers_1.ethers.providers.JsonRpcProvider(fromChainProvider);
            }
            // Estimate the gas price on the source network.
            const estGasPriceOnNativeInWei = yield this.ethersProvider.getGasPrice();
            // Calculate the transaction cost in the fromAsset.
            const transactionCostData = yield this.retrieveCostInAsset(fromAsset, fromAsset, fromChain, estGasPriceOnNativeInWei, this.config.tokens.addressZero);
            // Convert the transaction cost to toAsset using the market price.
            const transactionCostInToAsset = transactionCostData.costInAsset.mul(pricing.priceAinB).div(ethers_1.BigNumber.from(10).pow(18));
            console.log(`Transaction cost in ${toAsset}: ${transactionCostInToAsset.toString()}`);
            // Subtract the transaction cost in toAsset from the maxReward in toAsset to estimate the amount received.
            const estimatedReceivedAmount = maxRewardInToAsset.sub(transactionCostInToAsset);
            console.log(`Estimated received ${toAsset} amount in wei: ${estimatedReceivedAmount.toString()}`);
            return estimatedReceivedAmount;
        });
    }
    /**
     * Parse the given price string as float with decimal precision
     *
     * @param {BigNumber} price
     * @return {number}
     */
    static priceAsFloat(price) {
        return parseFloat(price.toString()) / 1e18;
    }
    /*
      =========================== PRIVATE METHODS ===========================
     */
    /**
     * This function calculates the price of asset A in terms of asset B, and ensures that the result
     * always has a fractional part of exactly 18 decimals.
     *
     * @param {BigNumber} priceA
     * @param {BigNumber} priceB
     * @return {BigNumber}
     */
    calculatePriceAinBOn18Decimals(priceA, priceB) {
        if (priceB.isZero()) {
            return ethers_1.BigNumber.from(0);
        }
        // Calculate the price of A in B, ensuring precision.
        const priceAinB = priceA.mul(ethers_1.BigNumber.from(10).pow(this.config.tokens.maxDecimals18)).div(priceB);
        const priceAinBAsFloat = Pricer.priceAsFloat(priceAinB);
        return this.parsePriceStringToBigNumberOn18Decimals(priceAinBAsFloat.toString());
    }
    /**
     * This function takes a string representation of a price and converts it into a BigNumber format,
     * ensuring that the fractional part is extended or truncated to exactly 18 decimals.
     *
     * @param {string} priceCached
     * @return {BigNumber}
     */
    parsePriceStringToBigNumberOn18Decimals(priceCached) {
        // Look for the decimal point (.) and return the index of the decimal point in price cached as string
        const decimalPointIndex = priceCached.indexOf('.');
        // Get the integer part of the price cached
        let integerPart = decimalPointIndex === -1 ? priceCached : priceCached.slice(0, decimalPointIndex);
        // Get the fractional part of the price cached
        const fractionalPart = decimalPointIndex === -1 ? '' : priceCached.slice(decimalPointIndex + 1);
        // Align fractional part to 18 decimals always!
        const adjustedFractionalPart = (fractionalPart || '')
            .padEnd(this.config.tokens.maxDecimals18, '0')
            .slice(0, this.config.tokens.maxDecimals18);
        // Finally the bignumber representation of the price cached is the integer part + fractional part padded with zeros to the right to match the current precision
        return ethers_1.BigNumber.from(integerPart + adjustedFractionalPart);
    }
    /**
     * Fetches the USD price of the given asset on the given blockchain and stores it
     * in the local price cache
     *
     * @param {AssetAndAddress}            assetObj
     * @param {NetworkNameOnPriceProvider} network
     * @return {Promise<string>}
     */
    fetchPriceAndStoreInCache(assetObj, network) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.ankr.getTokenPrice({
                blockchain: network,
                contractAddress: assetObj.address,
            });
            this.priceCache.set(assetObj.asset, network, response.usdPrice);
            return response.usdPrice;
        });
    }
    /**
     * Retrieves the current price of a given asset on a specified network, utilizing a cache to avoid unnecessary API calls.
     * If the price is not available in the cache, it attempts to fetch the price from an external provider and stores it in the cache.
     * If the asset is not found in the predefined map or fetching fails, it logs warnings/errors and may return a fake or zero price as a fallback.
     *
     * @param asset The asset for which the price is being retrieved.
     * @param destinationNetwork The network on which the asset price is to be fetched.
     * @return The price of the asset as a BigNumber. Returns a fake or zero price if the asset is not found or fetching fails.
     */
    receiveAssetPriceWithCache(asset, destinationNetwork) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let price = this.priceCache.get(asset, destinationNetwork);
            if (price) {
                return this.parsePriceStringToBigNumberOn18Decimals(price);
            }
            if (!price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[destinationNetwork]) {
                logger_1.logger.error({ asset, destinationNetwork }, 'Destination network not found in the map.');
                return ethers_1.BigNumber.from(0);
            }
            const assetObj = (_a = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[destinationNetwork]) === null || _a === void 0 ? void 0 : _a.find((assetObj) => (assetObj === null || assetObj === void 0 ? void 0 : assetObj.asset) === asset);
            if (!assetObj || !assetObj.address || !assetObj.asset) {
                logger_1.logger.debug({
                    asset,
                    destinationNetwork,
                }, '🍐 Asset not found in assetToAddressMap. Defaulting to fake price.');
                const maybeFakePrice = circuit_assets_1.AssetMapper.fakePriceOfAsset(this.config.tokens.oneOn18Decimals, asset);
                if (maybeFakePrice > 0) {
                    const maybeFakePriceInNominal = maybeFakePrice / this.config.tokens.oneOn18Decimals;
                    const fakePriceParsed = this.parsePriceStringToBigNumberOn18Decimals(maybeFakePriceInNominal.toString());
                    return fakePriceParsed;
                }
                logger_1.logger.error({ asset, destinationNetwork }, '🅰️ Asset for given network not found in assetToAddressMap. Return 0 as price.');
                return ethers_1.BigNumber.from(0);
            }
            try {
                let submittedAssetObj = assetObj;
                let isNativeToken = false;
                let nativeAsset;
                if (assetObj.address === '0x0000000000000000000000000000000000000000') {
                    const usdcAssetObj = (_b = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[destinationNetwork]) === null || _b === void 0 ? void 0 : _b.find(a => a.asset === price_provider_assets_1.SupportedAssetPriceProvider.USDC);
                    if (!usdcAssetObj) {
                        logger_1.logger.error({ network: destinationNetwork, asset: price_provider_assets_1.SupportedAssetPriceProvider.USDC }, 'USDC asset not found in the specified network for native token conversion.');
                        return ethers_1.BigNumber.from(0);
                    }
                    logger_1.logger.warn({ address: assetObj.address, asset: assetObj.asset, network: destinationNetwork }, 'Received native token. Using USDC for conversion.');
                    submittedAssetObj = usdcAssetObj;
                    isNativeToken = true;
                    nativeAsset = assetObj.asset;
                }
                price = yield this.fetchPriceAndStoreInCache(submittedAssetObj, destinationNetwork);
                // if (isNativeToken && nativeAsset) {
                //   const priceOfUSDCInNativeToken = await this.receiveAssetPriceWithCache(SupportedAssetPriceProvider.USDC, destinationNetwork)
                //   const priceOfUSDCInNativeTokenParsed = this.parsePriceStringToBigNumberOn18Decimals(priceOfUSDCInNativeToken.toString())
                //   const priceParsed = this.parsePriceStringToBigNumberOn18Decimals(price)
                //   const priceInNativeToken = priceOfUSDCInNativeTokenParsed.mul(priceParsed).div(BigNumber.from(10).pow(18))
                //   console.log(priceInNativeToken.toString())
                //   return priceInNativeToken
                // }
            }
            catch (err) {
                logger_1.logger.error({
                    asset,
                    destinationNetwork,
                    err: err.message,
                    cache: JSON.stringify(this.priceCache.getWholeCache()),
                }, `🅰️ Failed to fetch price for asset from Ankr`);
                return ethers_1.BigNumber.from(0);
            }
            return this.parsePriceStringToBigNumberOn18Decimals(price);
        });
    }
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
    calculatePricingAssetAinB(assetA, assetB, priceA, priceB, destinationNetwork) {
        const priceAinB = this.calculatePriceAinBOn18Decimals(priceA, priceB);
        const priceAInUsd = this.priceCache.get(assetA, destinationNetwork) || '0';
        const priceBInUsd = this.priceCache.get(assetB, destinationNetwork) || '0';
        return {
            assetA,
            assetB,
            priceAinB,
            priceAInUsd,
            priceBInUsd,
        };
    }
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
    calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofTokenTransfer) {
        const gasLimit = ofTokenTransfer === this.config.tokens.addressZero ? exports.ETH_TRANSFER_GAS_LIMIT : exports.ERC20_GAS_LIMIT;
        const costInWei = estGasPriceOnNativeInWei.mul(gasLimit);
        // Convert cost to cost in Asset from price ratio Asset/Native
        const priceOfNativeInAsset = this.calculatePriceAinBOn18Decimals(priceNative, priceAsset);
        const costInAsset = Pricer.priceAsFloat(priceOfNativeInAsset) * Pricer.priceAsFloat(costInWei);
        const costInUsd = Pricer.priceAsFloat(priceNative) * Pricer.priceAsFloat(costInWei);
        const costInEth = Pricer.priceAsFloat(costInWei);
        return {
            costInWei,
            costInEth: costInEth.toFixed(this.config.tokens.maxDecimals18),
            costInUsd,
            costInAsset: this.parsePriceStringToBigNumberOn18Decimals(costInAsset.toFixed(this.config.tokens.maxDecimals18)),
            asset,
        };
    }
}
exports.Pricer = Pricer;
//# sourceMappingURL=pricer.service.js.map