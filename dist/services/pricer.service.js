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
const price_provider_assets_1 = require("../config/price-provider-assets");
const logger_1 = require("../utils/logger");
const types_1 = require("./types");
const price_cache_1 = require("./price-cache");
const asset_mapper_1 = require("./asset-mapper");
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
    retrieveAssetPricing(assetA, assetB, sourceNetwork, destinationNetwork) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceA = yield this.receiveAssetPriceWithCache(assetA, sourceNetwork);
            const priceB = yield this.receiveAssetPriceWithCache(assetB, destinationNetwork);
            return yield this.calculatePricingAssetAinB(assetA, assetB, priceA, priceB, destinationNetwork);
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
    retrieveCostInAsset(asset, sourceNetwork, destinationAsset, destinationNetwork, estGasPriceOnNativeInWei, ofTokenTransfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceAsset = yield this.receiveAssetPriceWithCache(asset, sourceNetwork);
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
    getAssetObject(asset, destinationNetwork) {
        var _a, _b;
        if (!asset || !destinationNetwork) {
            logger_1.logger.error('Asset and destination network must be specified.');
            return { assetObject: ethers_1.BigNumber.from(0), isFakePrice: true };
        }
        if (!price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[destinationNetwork]) {
            logger_1.logger.error({ asset, destinationNetwork }, 'Destination network not found in the map.');
            return { assetObject: ethers_1.BigNumber.from(0), isFakePrice: true };
        }
        let normalizedAsset = asset;
        if (['t3btc', 't3dot', 't3sol', 't3usd', 'trn', 'brn'].includes(asset.toLowerCase())) {
            normalizedAsset = (0, price_provider_assets_1.mapT3rnVendorAssetsToSupportedAssetPrice)(asset);
            logger_1.logger.info({ asset, normalizedAsset, destinationNetwork }, '🍐 Asset is a t3 token. Normalizing to supported asset.');
        }
        let foundInRequestedNetwork = true;
        let assetDetails = (_a = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[destinationNetwork]) === null || _a === void 0 ? void 0 : _a.find((a) => a.asset === normalizedAsset);
        if (!assetDetails) {
            foundInRequestedNetwork = false;
            // Search for the asset in all networks
            for (const [networkName, assets] of Object.entries(price_provider_assets_1.networkToAssetAddressOnPriceProviderMap)) {
                const foundAsset = assets.find((a) => a.asset === normalizedAsset);
                if (foundAsset) {
                    assetDetails = Object.assign(Object.assign({}, foundAsset), { network: networkName });
                    logger_1.logger.info({ asset: normalizedAsset, originalNetwork: destinationNetwork, foundNetwork: networkName }, 'Asset found in another network.');
                    break;
                }
            }
        }
        if (assetDetails && !assetDetails.network) {
            assetDetails.network = destinationNetwork;
        }
        if (!assetDetails) {
            const maybeFakePrice = asset_mapper_1.AssetMapper.fakePriceOfAsset(this.config.tokens.oneOn18Decimals, normalizedAsset);
            if (maybeFakePrice > 0) {
                const maybeFakePriceInNominal = maybeFakePrice / this.config.tokens.oneOn18Decimals;
                return {
                    assetObject: this.parsePriceStringToBigNumberOn18Decimals(maybeFakePriceInNominal.toString()),
                    isFakePrice: true,
                };
            }
            else {
                logger_1.logger.error({ asset: normalizedAsset, destinationNetwork }, 'Asset not found and no fake price available. Returning 0.');
                return { assetObject: ethers_1.BigNumber.from(0), isFakePrice: true };
            }
        }
        return {
            assetObject: assetDetails,
            isFakePrice: false,
            foundInRequestedNetwork,
            foundNetwork: (_b = assetDetails.network) !== null && _b !== void 0 ? _b : destinationNetwork,
        };
    }
    /**
     * Evaluates the profitability of an order based on a given strategy.
     * Determines whether executing the order would result in a profit or loss.
     * Takes in wei and returns wei.
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
        const childLogger = logger_1.logger.child({
            id: order.id,
            balance: ethers_1.utils.formatEther(balance),
            amountToSpend: ethers_1.utils.formatEther(order.amount),
            rewardToReceive: ethers_1.utils.formatEther(order.maxReward),
            maxShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.maxAmountPerOrder),
            minShareOfMyBalancePerOrder: ethers_1.utils.formatEther(strategy.minAmountPerOrder),
            minProfitRate: ethers_1.utils.formatEther(strategy.minProfitPerOrder),
        });
        const rewardInDestinationAsset = order.maxReward
            .mul(pricing.priceAinB)
            .div(ethers_1.BigNumber.from(10).pow(this.config.tokens.maxDecimals18));
        const orderAmountInAsset = order.amount.div(ethers_1.BigNumber.from(10).pow(this.config.tokens.maxDecimals18));
        const potentialProfit = rewardInDestinationAsset
            .sub(costOfExecutionOnDestination.costInAsset)
            .sub(orderAmountInAsset);
        // used only at returning to avoid returning negative numbers
        const potentialLoss = potentialProfit.abs();
        childLogger.debug({ potentialProfit: ethers_1.utils.formatEther(potentialProfit) }, '🍐 Entry: deal conditions before any checks');
        if (potentialProfit.lte(ethers_1.BigNumber.from(0))) {
            childLogger.info({ potentialProfit: ethers_1.utils.formatEther(potentialProfit) }, '🍐 Potential profit is lte than zero. Return as not profitable');
            return {
                isProfitable: false,
                profit: ethers_1.BigNumber.from(0),
                loss: potentialLoss,
            };
        }
        let minProfitRateBaseline;
        let minProfitRateBaselineBN;
        let minProfitRateBaselineStr;
        let maxProfitRateBaseline;
        let maxProfitRateBaselineBN;
        try {
            minProfitRateBaseline = (parseFloat(strategy.minProfitRate.toString()) * parseFloat(balance.toString())) / 100;
            maxProfitRateBaseline =
                (parseFloat(strategy.maxShareOfMyBalancePerOrder.toString()) * parseFloat(balance.toString())) / 100;
            // BigNumber fails for fixed point numbers
            minProfitRateBaseline = Math.floor(minProfitRateBaseline);
            maxProfitRateBaseline = Math.ceil(maxProfitRateBaseline);
            maxProfitRateBaselineBN = ethers_1.BigNumber.from(this.floatToBigIntString(maxProfitRateBaseline));
            minProfitRateBaselineBN = ethers_1.BigNumber.from(this.floatToBigIntString(minProfitRateBaseline));
            minProfitRateBaselineStr = ethers_1.utils.formatEther(minProfitRateBaselineBN);
        }
        catch (err) {
            childLogger.error({ error: err.message }, '🍐 Failed to calculate profit rate baseline. Return as not profitable');
            return {
                isProfitable: false,
                profit: ethers_1.BigNumber.from(0),
                loss: potentialLoss,
            };
        }
        const isProfitAboveMinProfitRate = potentialProfit.gte(minProfitRateBaselineBN);
        const isProfitBelowMaxProfitRate = potentialProfit.lte(maxProfitRateBaselineBN);
        const isAmountBelowMaxAmountPerOrder = order.amount.lte(strategy.maxAmountPerOrder);
        const isAmountAboveMinAmountPerOrder = order.amount.gte(strategy.minAmountPerOrder);
        const isProfitAboveMinProfitPerOrder = potentialProfit.gte(strategy.minProfitPerOrder);
        childLogger.debug({
            minProfitRateBaselineStr,
            potentialProfit: ethers_1.utils.formatEther(potentialProfit),
            isProfitAboveMinProfitRate,
            isProfitBelowMaxProfitRate,
            isAmountBelowMaxAmountPerOrder,
            isAmountAboveMinAmountPerOrder,
            isProfitAboveMinProfitPerOrder,
        }, '🍐 IsProfitable conditions');
        // Check if profit satisfies strategy constraints
        const isProfitable = isProfitAboveMinProfitRate &&
            isProfitBelowMaxProfitRate &&
            isProfitAboveMinProfitPerOrder &&
            isAmountBelowMaxAmountPerOrder &&
            isAmountAboveMinAmountPerOrder;
        return {
            isProfitable,
            profit: isProfitable ? potentialProfit : ethers_1.BigNumber.from(0),
            loss: isProfitable ? ethers_1.BigNumber.from(0) : potentialLoss,
        };
    }
    /**
     * Assesses whether a deal is publishable based on user balance, estimated cost, and user-defined strategy.
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
        let overpayRatio;
        switch (overpayOption) {
            case types_1.OverpayRatio.slow:
                overpayRatio = 1.05; // 5% overpay
                break;
            case types_1.OverpayRatio.regular:
                overpayRatio = 1.1; // 10% overpay
                break;
            case types_1.OverpayRatio.fast:
                overpayRatio = 1.2; // 20% overpay
                break;
            case types_1.OverpayRatio.custom:
                overpayRatio = customOverpayRatio || 1.0;
                break;
            default:
                overpayRatio = 1.0;
        }
        let slippageTolerance;
        switch (slippageOption) {
            case types_1.Slippage.zero:
                slippageTolerance = 1.0; // No slippage
                break;
            case types_1.Slippage.regular:
                slippageTolerance = 1.02; // 2% slippage
                break;
            case types_1.Slippage.high:
                slippageTolerance = 1.05; // 5% slippage
                break;
            case types_1.Slippage.custom:
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
        const overpayScaleFactor = calculateScaleFactor(overpayRatio);
        const slippageScaleFactor = calculateScaleFactor(slippageTolerance);
        let overpayRatioInt = Math.floor(overpayRatio * overpayScaleFactor);
        let slippageToleranceInt = Math.floor(slippageTolerance * slippageScaleFactor);
        const adjustedCost = estimatedCostOfExecution.costInAsset.mul(overpayRatioInt).div(overpayScaleFactor); // Adjust for the first scaleFactor
        const adjustedPriceAinB = marketPricing.priceAinB.mul(slippageToleranceInt).div(slippageScaleFactor);
        const maxReward = adjustedCost.add(adjustedPriceAinB);
        if (userBalance.lt(maxReward)) {
            return {
                isPublishable: false,
                maxReward,
            };
        }
        const isPublishable = maxReward.lte(userStrategy.maxSpendLimit);
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
     * @param maxRewardWei
     * @return The estimated amount of 'toAsset' the user will receive, in wei.
     */
    estimateReceivedAmount(fromAsset, toAsset, fromChain, fromChainProvider, toChain, maxRewardWei) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ethersProvider && !fromChainProvider) {
                throw new Error('No provider URL for the source network was provided.');
            }
            const pricing = yield this.retrieveAssetPricing(fromAsset, toAsset, fromChain, toChain);
            // Convert the maxReward from its Wei representation to the equivalent amount in toAsset, considering the current market price.
            const maxRewardInToAsset = maxRewardWei.mul(pricing.priceAinB).div(ethers_1.BigNumber.from(10).pow(18));
            if (!this.ethersProvider) {
                this.ethersProvider = new ethers_1.ethers.providers.JsonRpcProvider(fromChainProvider);
            }
            const estGasPriceOnNativeInWei = yield this.ethersProvider.getGasPrice();
            // Calculate the transaction cost in the fromAsset.
            const transactionCostData = yield this.retrieveCostInAsset(fromAsset, fromChain, toAsset, toChain, estGasPriceOnNativeInWei, ethers_1.ethers.constants.AddressZero);
            // Convert the transaction cost to toAsset using the market price.
            const transactionCostInToAsset = transactionCostData.costInAsset
                .mul(pricing.priceAinB)
                .div(ethers_1.BigNumber.from(10).pow(18));
            // Subtract the transaction cost in toAsset from the maxReward in toAsset to estimate the amount received.
            const estimatedReceivedAmount = maxRewardInToAsset.sub(transactionCostInToAsset);
            return estimatedReceivedAmount;
        });
    }
    /**
     * Estimates the amount of 'toAsset' the user will receive at the end of the transaction,
     * taking into account executor tip, overpay, and slippage.
     *
     * @param fromAsset The asset being sent.
     * @param toAsset The asset to be received.
     * @param fromChain The network of the 'fromAsset'.
     * @param fromChainProvider The provider url for 'fromChain'.
     * @param toChain The network of the 'toAsset'.
     * @param maxRewardWei The maximum reward the user is willing to offer, in wei.
     * @param executorTipOption The value of the executor tip: 'low', 'regular', 'high', 'custom'.
     * @param overpayOption User's preference for overpaying to expedite the deal: 'slow', 'regular', 'fast', 'custom'.
     * @param slippageOption User's tolerance for price slippage in the deal: 'zero', 'regular', 'high', 'custom'.
     * @param customExecutorTipPercentage Custom executor tip in percentage if the 'custom' option is selected.
     * @param customExecutorTipValue Custom executor tip in wei if the 'custom' option is selected.
     * @param customOverpayRatio Custom overpay ratio if the 'custom' option is selected.
     * @param customSlippage Custom slippage tolerance if the 'custom' option is selected.
     * @return The estimated amount of 'toAsset' the user will receive, in wei.
     */
    estimateReceivedAmountWithOptions(fromAsset, toAsset, fromChain, fromChainProvider, toChain, maxRewardWei, executorTipOption, overpayOption, slippageOption, customExecutorTipPercentage, customExecutorTipValue, customOverpayRatio, customSlippage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (executorTipOption === 'custom' && !customExecutorTipValue && !customExecutorTipPercentage) {
                throw new Error('Received custom executor tip option but missing customExecutorTipValue or customExecutorTipPercentage.');
            }
            if (overpayOption === 'custom' && !customOverpayRatio) {
                throw new Error('Received custom overpay option but missing customOverpayRatio.');
            }
            if (slippageOption === 'custom' && !customSlippage) {
                throw new Error('Received custom slippage option but missing customSlippage.');
            }
            if (executorTipOption === 'custom' && customExecutorTipValue) {
                maxRewardWei = maxRewardWei.sub(customExecutorTipValue);
            }
            else {
                let executorTipMultiplier = 1;
                switch (executorTipOption) {
                    case 'low':
                        executorTipMultiplier = 0.95; // 5% less reward
                        break;
                    case 'regular':
                        executorTipMultiplier = 1; // No change
                        break;
                    case 'high':
                        executorTipMultiplier = 1.05; // 5% more reward
                        break;
                    case 'custom':
                        executorTipMultiplier = customExecutorTipPercentage !== null && customExecutorTipPercentage !== void 0 ? customExecutorTipPercentage : 1;
                        break;
                }
                maxRewardWei = maxRewardWei.mul(Math.floor(executorTipMultiplier * 100)).div(100);
            }
            // Process overpay option
            let overpayMultiplier = 1;
            switch (overpayOption) {
                case 'slow':
                    overpayMultiplier = 1.05; // 5% overpay
                    break;
                case 'regular':
                    overpayMultiplier = 1.1; // 10% overpay
                    break;
                case 'fast':
                    overpayMultiplier = 1.2; // 20% overpay
                    break;
                case 'custom':
                    overpayMultiplier = customOverpayRatio || 1.0;
                    break;
            }
            maxRewardWei = maxRewardWei.mul(Math.floor(overpayMultiplier * 100)).div(100);
            // Process slippage option
            let slippageMultiplier = 1;
            switch (slippageOption) {
                case 'zero':
                    slippageMultiplier = 1.0; // No slippage
                    break;
                case 'regular':
                    slippageMultiplier = 1.02; // 2% slippage
                    break;
                case 'high':
                    slippageMultiplier = 1.05; // 5% slippage
                    break;
                case 'custom':
                    slippageMultiplier = customSlippage || 1.0;
                    break;
            }
            const estimatedReceivedAmount = yield this.estimateReceivedAmount(fromAsset, toAsset, fromChain, fromChainProvider, toChain, maxRewardWei);
            const finalAmount = estimatedReceivedAmount.mul(Math.floor(slippageMultiplier * 100)).div(100);
            return finalAmount;
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
            const usdPrice = yield this.priceCache.getPriceFromCacheServer(assetObj.asset, network, assetObj.address);
            if (!usdPrice) {
                throw new Error('Failed to fetch price for asset from proxy server');
            }
            this.priceCache.set(assetObj.asset, network, usdPrice);
            return usdPrice;
        });
    }
    /**
     * Retrieves the current price of a given asset on a specified network, utilizing a cache to avoid unnecessary API calls.
     * If the price is not available in the cache, it attempts to fetch the price from an external provider and stores it in the cache.
     * If the asset is not found in the predefined map or fetching fails, it logs warnings/errors and may return a fake or zero price as a fallback.
     *
     * @param asset The asset for which the price is being retrieved.
     * @param networkId The network on which the asset price is to be fetched.
     * @return The price of the asset as a BigNumber. Returns a fake or zero price if the asset is not found or fetching fails.
     */
    receiveAssetPriceWithCache(asset, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { assetObject } = this.getAssetObject(asset, networkId);
            if (assetObject instanceof ethers_1.BigNumber) {
                return assetObject;
            }
            let price = yield this.priceCache.get(asset, assetObject.network, assetObject);
            if (price) {
                return this.parsePriceStringToBigNumberOn18Decimals(price);
            }
            try {
                price = yield this.fetchPriceAndStoreInCache(assetObject, assetObject.network);
            }
            catch (err) {
                logger_1.logger.error({
                    asset,
                    networkId,
                    err: err.message,
                    cache: JSON.stringify(this.priceCache.getWholeCache()),
                }, `🅰️ Failed to fetch price for asset from proxy server. Return zero.`);
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
        return __awaiter(this, void 0, void 0, function* () {
            let priceAInUsd;
            let priceBInUsd;
            const priceAinB = this.calculatePriceAinBOn18Decimals(priceA, priceB);
            const assetObjA = this.getAssetObject(assetA, destinationNetwork);
            const assetObjB = this.getAssetObject(assetB, destinationNetwork);
            if (assetObjA.assetObject instanceof ethers_1.BigNumber) {
                priceAInUsd = assetObjA.assetObject.toString();
            }
            else {
                priceAInUsd = (yield this.priceCache.get(assetA, assetObjA.assetObject.network, assetObjA.assetObject)) || '0';
            }
            if (assetObjB.assetObject instanceof ethers_1.BigNumber) {
                priceBInUsd = assetObjB.assetObject.toString();
            }
            else {
                priceBInUsd = (yield this.priceCache.get(assetB, assetObjB.assetObject.network, assetObjB.assetObject)) || '0';
            }
            return {
                assetA,
                assetB,
                priceAinB,
                priceAInUsd,
                priceBInUsd,
            };
        });
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
        const gasLimit = ofTokenTransfer === ethers_1.ethers.constants.AddressZero ? exports.ETH_TRANSFER_GAS_LIMIT : exports.ERC20_GAS_LIMIT;
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