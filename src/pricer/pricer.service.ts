import { BigNumber, ethers, utils } from 'ethers'
import { AnkrProvider } from '@ankr.com/ankr.js'
import {
  AssetAndAddress,
  NetworkNameOnPriceProvider,
  networkToAssetAddressOnPriceProviderMap,
  SupportedAssetPriceProvider,
} from '../config/price-provider-assets'
import { logger } from '../utils/logger'
import { Order } from '../types'
import {
  AssetAddressOnTarget,
  CostResult,
  DealPublishability,
  OrderProfitability,
  OrderProfitabilityProposalForSetAmount,
  PriceResult,
  UserPublishStrategy,
} from './types'
import { Config } from '../config/config'
import { PriceCache } from './price-cache'
import { AssetMapper } from '../config/circuit-assets'

export interface OrderArbitrageStrategy {
  minProfitPerOrder: BigNumber // in target asset
  minProfitRate: number // in %
  maxAmountPerOrder: BigNumber // in target asset
  minAmountPerOrder: BigNumber // in target asset
  maxShareOfMyBalancePerOrder: number // in %
}

export const ERC20_GAS_LIMIT = ethers.BigNumber.from(50000)
export const ETH_TRANSFER_GAS_LIMIT = ethers.BigNumber.from(21000)

/**
 * Represents a utility for pricing assets, evaluating orders, and assessing deals for profitability.
 */
export class Pricer {
  private readonly config: Config
  private readonly ankr: AnkrProvider
  readonly priceCache: PriceCache

  /**
   * Initializes a new instance of the Pricer class with the specified configuration.
   *
   * @param _config Configuration settings including provider URLs and token configurations.
   */
  constructor(_config: Config) {
    this.config = _config
    this.ankr = new AnkrProvider(this.config.pricer.providerUrl)
    this.priceCache = new PriceCache(this.config)
    this.priceCache.initCleanup()
  }

  /**
   * Retrieves the USD value of a specified amount of an asset.
   *
   * @param asset The asset for which to retrieve the price.
   * @param destinationNetwork The network on which the asset is located.
   * @param amount The amount of the asset.
   * @return The value of the specified amount of the asset in USD.
   */
  async receiveAssetUSDValue(
    asset: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
    amount: BigNumber,
  ): Promise<number> {
    const price = await this.receiveAssetPriceWithCache(asset, destinationNetwork)
    const valueOfAmountOfAssetInUSD = price.mul(amount).div(BigNumber.from(10).pow(this.config.tokens.maxDecimals18))

    return Pricer.priceAsFloat(valueOfAmountOfAssetInUSD)
  }

  /**
   * Retrieves pricing information for converting between two assets.
   *
   * @param assetA The first asset.
   * @param assetB The second asset, to which the first asset's price is being compared.
   * @param destinationNetwork The network on which the assets are located.
   * @return An object containing the price of assetA in terms of assetB.
   */
  async retrieveAssetPricing(
    assetA: SupportedAssetPriceProvider,
    assetB: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): Promise<PriceResult> {
    const priceA = await this.receiveAssetPriceWithCache(assetA, destinationNetwork)
    const priceB = await this.receiveAssetPriceWithCache(assetB, destinationNetwork)
    return this.calculatePricingAssetAinB(assetA, assetB, priceA, priceB, destinationNetwork)
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
  async retrieveCostInAsset(
    asset: SupportedAssetPriceProvider,
    destinationAsset: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
    estGasPriceOnNativeInWei: BigNumber,
    ofTokenTransfer: string,
  ): Promise<CostResult> {
    const priceAsset = await this.receiveAssetPriceWithCache(asset, destinationNetwork)
    const priceNative = await this.receiveAssetPriceWithCache(destinationAsset, destinationNetwork)
    logger.debug(
      {
        asset,
        destinationAsset,
        destinationNetwork,
        priceAsset: priceAsset.toString(),
        priceNative: priceNative.toString(),
      },
      '⚓️ Retrieved prices of assets',
    )
    return this.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofTokenTransfer)
  }

  // Converts a floating-point number to a string representation of a BigInt.
  floatToBigIntString(value: number): string {
    const asBigInt = BigInt(value)
    return asBigInt.toString()
  }

  // Converts a floating-point number to a BigNumber.
  floatToBigNum(value: number): BigNumber {
    return BigNumber.from(this.floatToBigIntString(value))
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
  evaluateDeal(
    balance: BigNumber,
    costOfExecutionOnDestination: CostResult,
    strategy: OrderArbitrageStrategy,
    order: Order,
    pricing: PriceResult,
  ): OrderProfitability {
    const rewardInDestinationAsset = order.maxReward
      .mul(pricing.priceAinB)
      .div(BigNumber.from(10).pow(this.config.tokens.maxDecimals18))
    const potentialProfit = rewardInDestinationAsset.sub(costOfExecutionOnDestination.costInAsset).sub(order.amount)

    logger.debug(
      {
        id: order.id,
        balance: utils.formatEther(balance),
        amountToSpend: utils.formatEther(order.amount),
        rewardToReceive: utils.formatEther(order.maxReward),
        maxShareOfMyBalancePerOrder: utils.formatEther(strategy.maxAmountPerOrder),
        minShareOfMyBalancePerOrder: utils.formatEther(strategy.minAmountPerOrder),
        minProfitRate: utils.formatEther(strategy.minProfitPerOrder),
        potentialProfit: utils.formatEther(potentialProfit),
      },
      '🍐 evaluateDeal::Entry - deal conditions before any checks',
    )

    if (potentialProfit.lte(BigNumber.from(0))) {
      return {
        isProfitable: false,
        profit: BigNumber.from(0),
        loss: potentialProfit,
      }
    }

    let minProfitRateBaseline
    let minProfitRateBaselineBN
    let minProfitRateBaselineStr
    let maxProfitRateBaseline
    let maxProfitRateBaselineBN

    try {
      minProfitRateBaseline = (parseFloat(strategy.minProfitRate.toString()) * parseFloat(balance.toString())) / 100
      // Bignumber would fail for fixed point numbers
      minProfitRateBaseline = Math.floor(minProfitRateBaseline)

      maxProfitRateBaseline =
        (parseFloat(strategy.maxShareOfMyBalancePerOrder.toString()) * parseFloat(balance.toString())) / 100
      maxProfitRateBaseline = Math.ceil(maxProfitRateBaseline)

      maxProfitRateBaselineBN = BigNumber.from(this.floatToBigIntString(maxProfitRateBaseline))
      minProfitRateBaselineBN = BigNumber.from(this.floatToBigIntString(minProfitRateBaseline))
      minProfitRateBaselineStr = utils.formatEther(minProfitRateBaselineBN)
    } catch (error) {
      logger.warn(
        {
          id: order.id,
          error,
          balance: utils.formatEther(balance),
          amountToSpend: utils.formatEther(order.amount),
          rewardToReceive: utils.formatEther(order.maxReward),
          maxShareOfMyBalancePerOrder: utils.formatEther(strategy.maxAmountPerOrder),
          minShareOfMyBalancePerOrder: utils.formatEther(strategy.minAmountPerOrder),
          minProfitRate: utils.formatEther(strategy.minProfitPerOrder),
        },
        '🍐 evaluateDeal::Failed to calculate minProfitRateBaseline or maxProfitRateBaseline; return as not profitable',
      )
      return {
        isProfitable: false,
        profit: BigNumber.from(0),
        loss: potentialProfit,
      }
    }

    const isProfitAboveMinProfitRate = potentialProfit.gte(minProfitRateBaselineBN)
    const isProfitBelowMaxProfitRate = potentialProfit.lte(maxProfitRateBaselineBN)
    const isAmountBelowMaxAmountPerOrder = order.amount.lte(strategy.maxAmountPerOrder)
    const isAmountAboveMinAmountPerOrder = order.amount.gte(strategy.minAmountPerOrder)
    const isProfitAboveMinProfitPerOrder = potentialProfit.gte(strategy.minProfitPerOrder)

    logger.debug(
      {
        id: order.id,
        minProfitRateBaselineStr,
        potentialProfit: utils.formatEther(potentialProfit),
        isProfitAboveMinProfitRate,
        isProfitBelowMaxProfitRate,
        isAmountBelowMaxAmountPerOrder,
        isAmountAboveMinAmountPerOrder,
        isProfitAboveMinProfitPerOrder,
      },
      '🍐 evaluateDeal::isProfitable conditions',
    )

    // Check if profit satisfies strategy constraints
    const isProfitable =
      isProfitAboveMinProfitRate &&
      isProfitBelowMaxProfitRate &&
      isProfitAboveMinProfitPerOrder &&
      isAmountBelowMaxAmountPerOrder &&
      isAmountAboveMinAmountPerOrder

    return {
      isProfitable,
      profit: isProfitable ? potentialProfit : BigNumber.from(0),
      loss: isProfitable ? BigNumber.from(0) : potentialProfit,
    }
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
  assessDealForPublication(
    userBalance: BigNumber,
    estimatedCostOfExecution: CostResult,
    userStrategy: UserPublishStrategy,
    marketPricing: PriceResult,
    overpayOption: 'slow' | 'regular' | 'fast' | 'custom',
    slippageOption: 'zero' | 'regular' | 'high' | 'custom',
    customOverpayRatio?: number,
    customSlippage?: number,
  ): DealPublishability {
    // Determine the overpay ratio based on the selected option
    let overpayRatio
    switch (overpayOption) {
      case 'slow':
        overpayRatio = 1.05 // 5% overpay
        break
      case 'regular':
        overpayRatio = 1.1 // 10% overpay
        break
      case 'fast':
        overpayRatio = 1.2 // 20% overpay
        break
      case 'custom':
        overpayRatio = customOverpayRatio || 1.0
        break
      default:
        overpayRatio = 1.0
    }

    // Determine the slippage tolerance
    let slippageTolerance
    switch (slippageOption) {
      case 'zero':
        slippageTolerance = 1.0 // No slippage
        break
      case 'regular':
        slippageTolerance = 1.02 // 2% slippage
        break
      case 'high':
        slippageTolerance = 1.05 // 5% slippage
        break
      case 'custom':
        slippageTolerance = customSlippage || 1.0
        break
      default:
        slippageTolerance = 1.0
    }

    // Function to calculate the scale factor based on decimal places
    const calculateScaleFactor = (value: number) => {
      const decimalPlaces = (value.toString().split('.')[1] || '').length
      return Math.pow(10, decimalPlaces)
    }

    // Determine the maximum scale factor needed for both overpayRatio and slippageTolerance
    const overpayScaleFactor = calculateScaleFactor(overpayRatio)
    const slippageScaleFactor = calculateScaleFactor(slippageTolerance)

    // Convert overpayRatio and slippageTolerance to integer equivalents
    let overpayRatioInt = Math.floor(overpayRatio * overpayScaleFactor)
    let slippageToleranceInt = Math.floor(slippageTolerance * slippageScaleFactor)

    // Adjust maxReward calculation with overpay and slippage
    const adjustedCost = estimatedCostOfExecution.costInAsset.mul(overpayRatioInt).div(overpayScaleFactor) // Adjust for the first scaleFactor

    console.log(
      `overpayRatio: ${overpayRatio}, overpayRatioInt: ${overpayRatioInt}, overpayScaleFactor: ${overpayScaleFactor}`,
    )

    console.log(
      `slippageTolerance: ${slippageTolerance}, slippageToleranceInt: ${slippageToleranceInt}, slippageScaleFactor: ${slippageScaleFactor}`,
    )

    console.log(`adjustedCost: ${utils.formatEther(adjustedCost)}`)

    // Adjust marketPricing.priceAinB with slippage tolerance
    const adjustedPriceAinB = marketPricing.priceAinB.mul(slippageToleranceInt).div(slippageScaleFactor)

    console.log(`adjustedPriceAinB: ${utils.formatEther(adjustedPriceAinB)}`)

    // Calculate maxReward considering the adjusted cost and market pricing with slippage
    const maxReward = adjustedCost.add(adjustedPriceAinB)

    console.log(`userBalance: ${utils.formatEther(userBalance)}, maxReward: ${utils.formatEther(maxReward)}`)
    // Assess if the user's balance is sufficient for the maxReward
    if (userBalance.lt(maxReward)) {
      return {
        isPublishable: false,
        maxReward,
      }
    }

    console.log(`maxReward: ${utils.formatEther(maxReward)}`)

    // Consider user's strategy constraints (e.g., max spending limit)
    const isWithinStrategyLimits = maxReward.lte(userStrategy.maxSpendLimit as BigNumber)

    // Determine if the deal is publishable
    const isPublishable = isWithinStrategyLimits

    return {
      isPublishable,
      maxReward: isPublishable ? maxReward : BigNumber.from(0),
    }
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
  proposeDealForSetAmount(
    balance: BigNumber,
    costOfExecutionOnDestination: CostResult,
    strategy: OrderArbitrageStrategy,
    order: Order,
    pricing: PriceResult,
  ): OrderProfitabilityProposalForSetAmount {
    const { isProfitable, profit, loss } = this.evaluateDeal(
      balance,
      costOfExecutionOnDestination,
      strategy,
      order,
      pricing,
    )

    const proposedMaxReward = profit.add(costOfExecutionOnDestination.costInAsset).add(order.amount)

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
    }
  }

  /**
   * Parse the given price string as float with decimal precision
   *
   * @param {BigNumber} price
   * @return {number}
   */
  static priceAsFloat(price: BigNumber): number {
    return parseFloat(price.toString()) / 1e18
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
  calculatePriceAinBOn18Decimals(priceA: BigNumber, priceB: BigNumber): BigNumber {
    if (priceB.isZero()) {
      return BigNumber.from(0)
    }
    // Calculate the price of A in B, ensuring precision.
    const priceAinB = priceA.mul(BigNumber.from(10).pow(this.config.tokens.maxDecimals18)).div(priceB)
    const priceAinBAsFloat = Pricer.priceAsFloat(priceAinB)
    return this.parsePriceStringToBigNumberOn18Decimals(priceAinBAsFloat.toString())
  }

  /**
   * This function takes a string representation of a price and converts it into a BigNumber format,
   * ensuring that the fractional part is extended or truncated to exactly 18 decimals.
   *
   * @param {string} priceCached
   * @return {BigNumber}
   */
  parsePriceStringToBigNumberOn18Decimals(priceCached: string): BigNumber {
    // Look for the decimal point (.) and return the index of the decimal point in price cached as string
    const decimalPointIndex = priceCached.indexOf('.')
    // Get the integer part of the price cached
    let integerPart = decimalPointIndex === -1 ? priceCached : priceCached.slice(0, decimalPointIndex)
    // Get the fractional part of the price cached
    const fractionalPart = decimalPointIndex === -1 ? '' : priceCached.slice(decimalPointIndex + 1)
    // Align fractional part to 18 decimals always!
    const adjustedFractionalPart = (fractionalPart || '')
      .padEnd(this.config.tokens.maxDecimals18, '0')
      .slice(0, this.config.tokens.maxDecimals18)
    // Finally the bignumber representation of the price cached is the integer part + fractional part padded with zeros to the right to match the current precision
    return BigNumber.from(integerPart + adjustedFractionalPart)
  }

  /**
   * Fetches the USD price of the given asset on the given blockchain and stores it
   * in the local price cache
   *
   * @param {AssetAndAddress}            assetObj
   * @param {NetworkNameOnPriceProvider} network
   * @return {Promise<string>}
   */
  async fetchPriceAndStoreInCache(assetObj: AssetAndAddress, network: NetworkNameOnPriceProvider): Promise<string> {
    const response = await this.ankr.getTokenPrice({
      blockchain: network,
      contractAddress: assetObj.address,
    })

    this.priceCache.set(assetObj.asset, network, response.usdPrice)

    return response.usdPrice
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
  async receiveAssetPriceWithCache(
    asset: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): Promise<BigNumber> {
    let price = this.priceCache.get(asset, destinationNetwork)
    if (price) {
      return this.parsePriceStringToBigNumberOn18Decimals(price)
    }

    const assetObj = networkToAssetAddressOnPriceProviderMap[destinationNetwork]?.find(
      (assetObj: AssetAddressOnTarget) => assetObj.asset === asset,
    )
    if (!assetObj) {
      logger.debug(
        {
          asset,
          destinationNetwork,
        },
        '🍐 Asset not found in assetToAddressMap. Defaulting to fake price.',
      )

      const maybeFakePrice = AssetMapper.fakePriceOfAsset(this.config.tokens.oneOn18Decimals, asset)

      if (maybeFakePrice > 0) {
        const maybeFakePriceInNominal = maybeFakePrice / this.config.tokens.oneOn18Decimals
        const fakePriceParsed = this.parsePriceStringToBigNumberOn18Decimals(maybeFakePriceInNominal.toString())

        return fakePriceParsed
      }

      logger.error(
        { asset, destinationNetwork },
        '🅰️ Asset for given network not found in assetToAddressMap. Return 0 as price.',
      )
      return BigNumber.from(0)
    }

    try {
      price = await this.fetchPriceAndStoreInCache(assetObj, destinationNetwork as NetworkNameOnPriceProvider)
    } catch (err: any) {
      logger.error(
        {
          asset,
          destinationNetwork,
          err: err.message,
          cache: JSON.stringify(this.priceCache.getWholeCache()),
        },
        `🅰️ Failed to fetch price for asset from Ankr`,
      )
      return BigNumber.from(0)
    }
    return this.parsePriceStringToBigNumberOn18Decimals(price)
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
  calculatePricingAssetAinB(
    assetA: SupportedAssetPriceProvider,
    assetB: SupportedAssetPriceProvider,
    priceA: BigNumber,
    priceB: BigNumber,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): PriceResult {
    const priceAinB = this.calculatePriceAinBOn18Decimals(priceA, priceB)
    const priceAInUsd = this.priceCache.get(assetA, destinationNetwork) || '0'
    const priceBInUsd = this.priceCache.get(assetB, destinationNetwork) || '0'
    return {
      assetA,
      assetB,
      priceAinB,
      priceAInUsd,
      priceBInUsd,
    }
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
  calculateCostInAsset(
    asset: string,
    priceAsset: BigNumber,
    priceNative: BigNumber,
    estGasPriceOnNativeInWei: BigNumber,
    ofTokenTransfer: string,
  ): CostResult {
    const gasLimit = ofTokenTransfer === this.config.tokens.addressZero ? ETH_TRANSFER_GAS_LIMIT : ERC20_GAS_LIMIT
    const costInWei = estGasPriceOnNativeInWei.mul(gasLimit)

    // Convert cost to cost in Asset from price ratio Asset/Native
    const priceOfNativeInAsset = this.calculatePriceAinBOn18Decimals(priceNative, priceAsset)

    const costInAsset = Pricer.priceAsFloat(priceOfNativeInAsset) * Pricer.priceAsFloat(costInWei)
    const costInUsd = Pricer.priceAsFloat(priceNative) * Pricer.priceAsFloat(costInWei)
    const costInEth = Pricer.priceAsFloat(costInWei)

    return {
      costInWei,
      costInEth: costInEth.toFixed(this.config.tokens.maxDecimals18),
      costInUsd,
      costInAsset: this.parsePriceStringToBigNumberOn18Decimals(costInAsset.toFixed(this.config.tokens.maxDecimals18)),
      asset,
    }
  }
}
