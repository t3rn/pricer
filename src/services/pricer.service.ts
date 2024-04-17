import { BigNumber, ethers, utils } from 'ethers'
import {
  AssetAndAddress,
  AssetAndAddressExtended,
  mapT3rnVendorAssetsToSupportedAssetPrice,
  NetworkNameOnPriceProvider,
  networkToAssetAddressOnPriceProviderMap,
  SupportedAssetPriceProvider,
} from '../config/price-provider-assets'
import { logger } from '../utils/logger'
import { Order } from '../types'
import {
  CostResult,
  DealPublishability,
  OrderProfitability,
  OrderProfitabilityProposalForSetAmount,
  OverpayRatio,
  PriceResult,
  Slippage,
  UserPublishStrategy,
} from './types'
import { Config } from '../config/config'
import { PriceCache } from './price-cache'
import { AssetMapper } from './asset-mapper'

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
  readonly priceCache: PriceCache

  /**
   * Initializes a new instance of the Pricer class with the specified configuration.
   *
   * @param _config Configuration settings including provider URLs and token configurations.
   */
  constructor(_config: Config) {
    this.config = _config
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
    sourceNetwork: NetworkNameOnPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): Promise<PriceResult> {
    const priceA = await this.receiveAssetPriceWithCache(assetA, sourceNetwork)
    const priceB = await this.receiveAssetPriceWithCache(assetB, destinationNetwork)

    return await this.calculatePricingAssetAinB(assetA, assetB, priceA, priceB, destinationNetwork)
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
    sourceNetwork: NetworkNameOnPriceProvider,
    destinationAsset: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
    estGasPriceOnNativeInWei: BigNumber,
    ofTokenTransfer: string,
  ): Promise<CostResult> {
    const priceAsset = await this.receiveAssetPriceWithCache(asset, sourceNetwork)
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

  getAssetObject(
    asset: SupportedAssetPriceProvider,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): AssetAndAddressExtended {
    if (!asset || !destinationNetwork) {
      logger.error('Asset and destination network must be specified.')
      return { assetObject: BigNumber.from(0), isFakePrice: true }
    }

    if (!networkToAssetAddressOnPriceProviderMap[destinationNetwork]) {
      logger.error({ asset, destinationNetwork }, 'Destination network not found in the map.')
      return { assetObject: BigNumber.from(0), isFakePrice: true }
    }

    let normalizedAsset = asset
    if (['t3btc', 't3dot', 't3sol', 't3usd', 'trn', 'brn'].includes(asset.toLowerCase())) {
      normalizedAsset = mapT3rnVendorAssetsToSupportedAssetPrice(asset)
      logger.info(
        { asset, normalizedAsset, destinationNetwork },
        '🍐 Asset is a t3 token. Normalizing to supported asset.',
      )
    }

    let foundInRequestedNetwork = true
    let assetDetails: AssetAndAddress | undefined = networkToAssetAddressOnPriceProviderMap[destinationNetwork]?.find(
      (a) => a.asset === normalizedAsset,
    )

    if (!assetDetails) {
      foundInRequestedNetwork = false
      // Search for the asset in all networks
      for (const [networkName, assets] of Object.entries(networkToAssetAddressOnPriceProviderMap)) {
        const foundAsset = assets.find((a) => a.asset === normalizedAsset)
        if (foundAsset) {
          assetDetails = { ...foundAsset, network: networkName as NetworkNameOnPriceProvider }
          logger.info(
            { asset: normalizedAsset, originalNetwork: destinationNetwork, foundNetwork: networkName },
            'Asset found in another network.',
          )
          break
        }
      }
    }

    if (assetDetails && !assetDetails.network) {
      assetDetails.network = destinationNetwork
    }

    if (!assetDetails) {
      const maybeFakePrice = AssetMapper.fakePriceOfAsset(this.config.tokens.oneOn18Decimals, normalizedAsset)
      if (maybeFakePrice > 0) {
        const maybeFakePriceInNominal = maybeFakePrice / this.config.tokens.oneOn18Decimals
        return {
          assetObject: this.parsePriceStringToBigNumberOn18Decimals(maybeFakePriceInNominal.toString()),
          isFakePrice: true,
        }
      } else {
        logger.error(
          { asset: normalizedAsset, destinationNetwork },
          'Asset not found and no fake price available. Returning 0.',
        )
        return { assetObject: BigNumber.from(0), isFakePrice: true }
      }
    }

    return {
      assetObject: assetDetails,
      isFakePrice: false,
      foundInRequestedNetwork,
      foundNetwork: assetDetails.network ?? destinationNetwork,
    }
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
  evaluateDeal(
    balance: BigNumber,
    costOfExecutionOnDestination: CostResult,
    strategy: OrderArbitrageStrategy,
    order: Order,
    pricing: PriceResult,
  ): OrderProfitability {
    const childLogger = logger.child({
      id: order.id,
      balance: utils.formatEther(balance),
      amountToSpend: utils.formatEther(order.amount),
      rewardToReceive: utils.formatEther(order.maxReward),
      maxShareOfMyBalancePerOrder: utils.formatEther(strategy.maxAmountPerOrder),
      minShareOfMyBalancePerOrder: utils.formatEther(strategy.minAmountPerOrder),
      minProfitRate: utils.formatEther(strategy.minProfitPerOrder),
    })
    const rewardInDestinationAsset = order.maxReward
      .mul(pricing.priceAinB)
      .div(BigNumber.from(10).pow(this.config.tokens.maxDecimals18))
    const orderAmountInAsset = order.amount.div(BigNumber.from(10).pow(this.config.tokens.maxDecimals18))
    const potentialProfit = rewardInDestinationAsset
      .sub(costOfExecutionOnDestination.costInAsset)
      .sub(orderAmountInAsset)
    // used only at returning to avoid returning negative numbers
    const potentialLoss = potentialProfit.abs()

    childLogger.debug(
      { potentialProfit: utils.formatEther(potentialProfit) },
      '🍐 Entry: deal conditions before any checks',
    )

    if (potentialProfit.lte(BigNumber.from(0))) {
      childLogger.info(
        { potentialProfit: utils.formatEther(potentialProfit) },
        '🍐 Potential profit is lte than zero. Return as not profitable',
      )
      return {
        isProfitable: false,
        profit: BigNumber.from(0),
        loss: potentialLoss,
      }
    }

    let minProfitRateBaseline
    let minProfitRateBaselineBN
    let minProfitRateBaselineStr
    let maxProfitRateBaseline
    let maxProfitRateBaselineBN

    try {
      minProfitRateBaseline = (parseFloat(strategy.minProfitRate.toString()) * parseFloat(balance.toString())) / 100
      // BigNumber fails for fixed point numbers
      minProfitRateBaseline = Math.floor(minProfitRateBaseline)

      maxProfitRateBaseline =
        (parseFloat(strategy.maxShareOfMyBalancePerOrder.toString()) * parseFloat(balance.toString())) / 100
      maxProfitRateBaseline = Math.ceil(maxProfitRateBaseline)

      maxProfitRateBaselineBN = BigNumber.from(this.floatToBigIntString(maxProfitRateBaseline))
      minProfitRateBaselineBN = BigNumber.from(this.floatToBigIntString(minProfitRateBaseline))
      minProfitRateBaselineStr = utils.formatEther(minProfitRateBaselineBN)
    } catch (err: any) {
      childLogger.error({ error: err.message }, '🍐 Failed to calculate profit rate baseline. Return as not profitable')
      return {
        isProfitable: false,
        profit: BigNumber.from(0),
        loss: potentialLoss,
      }
    }

    const isProfitAboveMinProfitRate = potentialProfit.gte(minProfitRateBaselineBN)
    const isProfitBelowMaxProfitRate = potentialProfit.lte(maxProfitRateBaselineBN)
    const isAmountBelowMaxAmountPerOrder = order.amount.lte(strategy.maxAmountPerOrder)
    const isAmountAboveMinAmountPerOrder = order.amount.gte(strategy.minAmountPerOrder)
    const isProfitAboveMinProfitPerOrder = potentialProfit.gte(strategy.minProfitPerOrder)

    childLogger.debug(
      {
        minProfitRateBaselineStr,
        potentialProfit: utils.formatEther(potentialProfit),
        isProfitAboveMinProfitRate,
        isProfitBelowMaxProfitRate,
        isAmountBelowMaxAmountPerOrder,
        isAmountAboveMinAmountPerOrder,
        isProfitAboveMinProfitPerOrder,
      },
      '🍐 IsProfitable conditions',
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
      loss: isProfitable ? BigNumber.from(0) : potentialLoss,
    }
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
  assessDealForPublication(
    userBalance: BigNumber,
    estimatedCostOfExecution: CostResult,
    userStrategy: UserPublishStrategy,
    marketPricing: PriceResult,
    overpayOption: OverpayRatio,
    slippageOption: Slippage,
    customOverpayRatio?: number,
    customSlippage?: number,
  ): DealPublishability {
    let overpayRatio
    switch (overpayOption) {
      case OverpayRatio.slow:
        overpayRatio = 1.05 // 5% overpay
        break
      case OverpayRatio.regular:
        overpayRatio = 1.1 // 10% overpay
        break
      case OverpayRatio.fast:
        overpayRatio = 1.2 // 20% overpay
        break
      case OverpayRatio.custom:
        overpayRatio = customOverpayRatio || 1.0
        break
      default:
        overpayRatio = 1.0
    }

    let slippageTolerance
    switch (slippageOption) {
      case Slippage.zero:
        slippageTolerance = 1.0 // No slippage
        break
      case Slippage.regular:
        slippageTolerance = 1.02 // 2% slippage
        break
      case Slippage.high:
        slippageTolerance = 1.05 // 5% slippage
        break
      case Slippage.custom:
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

    const overpayScaleFactor = calculateScaleFactor(overpayRatio)
    const slippageScaleFactor = calculateScaleFactor(slippageTolerance)

    let overpayRatioInt = Math.floor(overpayRatio * overpayScaleFactor)
    let slippageToleranceInt = Math.floor(slippageTolerance * slippageScaleFactor)

    const adjustedCost = estimatedCostOfExecution.costInAsset.mul(overpayRatioInt).div(overpayScaleFactor) // Adjust for the first scaleFactor
    const adjustedPriceAinB = marketPricing.priceAinB.mul(slippageToleranceInt).div(slippageScaleFactor)

    const maxReward = adjustedCost.add(adjustedPriceAinB)
    if (userBalance.lt(maxReward)) {
      return {
        isPublishable: false,
        maxReward,
      }
    }

    const isPublishable = maxReward.lte(userStrategy.maxSpendLimit as BigNumber)

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
   * Estimates the details of the transaction when sending assets from one chain to another.
   *
   * @param fromAsset The asset being sent.
   * @param toAsset The asset to be received.
   * @param fromChain The network of the 'fromAsset'.
   * @param fromChainProvider The provider URL for 'fromChain'.
   * @param toChain The network of the 'toAsset'.
   * @param maxRewardWei The maximum amount of 'fromAsset' in Wei to be sent.
   * @returns Details of the transaction, including the estimated amount received, gas fees, and bridge fees:
              estimatedReceivedAmountWei: BigNumber
              gasFeeWei: BigNumber
              bridgeFeeWei: BigNumber
              estimatedReceivedAmountUSD: number
              gasFeeUSD: number
              bridgeFeeUSD: number
              BRNbonusUSD: number
   */
  async estimateReceivedAmount(
    fromAsset: SupportedAssetPriceProvider,
    toAsset: SupportedAssetPriceProvider,
    fromChain: NetworkNameOnPriceProvider,
    fromChainProvider: string,
    toChain: NetworkNameOnPriceProvider,
    maxRewardWei: BigNumber,
  ): Promise<{
    estimatedReceivedAmountWei: BigNumber
    gasFeeWei: BigNumber
    bridgeFeeWei: BigNumber
    estimatedReceivedAmountUSD: number
    gasFeeUSD: number
    bridgeFeeUSD: number
    BRNbonusUSD: number
  }> {
    if (!fromAsset || !toAsset || !fromChain || !fromChainProvider || !toChain || !maxRewardWei) {
      throw new Error('All parameters must be provided and valid.')
    }

    const fromChainEthersProvider = new ethers.providers.JsonRpcProvider(fromChainProvider)

    // Retrieve the pricing information for converting fromAsset to toAsset.
    const pricing = await this.retrieveAssetPricing(fromAsset, toAsset, fromChain, toChain)

    // Convert the maxReward from its Wei representation to the equivalent amount in toAsset, considering the current market price.
    const maxRewardInToAsset = maxRewardWei.mul(pricing.priceAinB).div(BigNumber.from(10).pow(18))

    // Estimate the gas price on the source network, which is relevant for the initial transaction cost calculation.
    const estGasPriceOnSourceInWei = await fromChainEthersProvider.getGasPrice()

    // Determine the appropriate gas limit based on the asset type being transferred from the source chain
    const sourceGasLimit = fromAsset === SupportedAssetPriceProvider.ETH ? ETH_TRANSFER_GAS_LIMIT : ERC20_GAS_LIMIT

    // Calculate the total estimated gas fee on the source network for the transaction
    const sourceGasFeeWei = estGasPriceOnSourceInWei.mul(sourceGasLimit)

    const sourceGasFeeUSD = await this.receiveAssetUSDValue(fromAsset, fromChain, sourceGasFeeWei)

    const { assetObject } = this.getAssetObject(fromAsset, fromChain)

    // Calculate the transaction cost in the fromAsset, using the source network's gas price
    const transactionCostData = await this.retrieveCostInAsset(
      fromAsset,
      fromChain,
      toAsset,
      toChain,
      estGasPriceOnSourceInWei,
      assetObject instanceof BigNumber ? ethers.constants.AddressZero : assetObject.address,
    )

    // Convert the transaction cost to toAsset using the market price.
    const transactionCostInToAsset = transactionCostData.costInAsset
      .mul(pricing.priceAinB)
      .div(BigNumber.from(10).pow(18))

    // Subtract the transaction cost in toAsset from the maxReward in toAsset to estimate the amount received.
    const estimatedReceivedAmountWei = maxRewardInToAsset.sub(transactionCostInToAsset)
    const estimatedReceivedAmountUSD = await this.receiveAssetUSDValue(toAsset, toChain, estimatedReceivedAmountWei)

    const bridgeFeeWei = maxRewardWei.sub(estimatedReceivedAmountWei)
    const bridgeFeeUSD = await this.receiveAssetUSDValue(toAsset, toChain, bridgeFeeWei)

    return {
      estimatedReceivedAmountWei,
      gasFeeWei: sourceGasFeeWei,
      bridgeFeeWei,
      estimatedReceivedAmountUSD,
      gasFeeUSD: sourceGasFeeUSD,
      bridgeFeeUSD,
      BRNbonusUSD: estimatedReceivedAmountUSD,
    }
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
   * @returns Details of the transaction, including the estimated amount received, gas fees, and bridge fees:
              estimatedReceivedAmountWei: BigNumber
              gasFeeWei: BigNumber
              bridgeFeeWei: BigNumber
              estimatedReceivedAmountUSD: number
              gasFeeUSD: number
              bridgeFeeUSD: number
              BRNbonusUSD: number
   */
  async estimateReceivedAmountWithOptions(
    fromAsset: SupportedAssetPriceProvider,
    toAsset: SupportedAssetPriceProvider,
    fromChain: NetworkNameOnPriceProvider,
    fromChainProvider: string,
    toChain: NetworkNameOnPriceProvider,
    maxRewardWei: BigNumber,
    executorTipOption: 'low' | 'regular' | 'high' | 'custom',
    overpayOption: 'slow' | 'regular' | 'fast' | 'custom',
    slippageOption: 'zero' | 'regular' | 'high' | 'custom',
    customExecutorTipPercentage?: number,
    customExecutorTipValue?: BigNumber,
    customOverpayRatio?: number,
    customSlippage?: number,
  ): Promise<{
    estimatedReceivedAmountWei: BigNumber
    gasFeeWei: BigNumber
    bridgeFeeWei: BigNumber
    estimatedReceivedAmountUSD: number
    gasFeeUSD: number
    bridgeFeeUSD: number
    BRNbonusUSD: number
  }> {
    if (!fromAsset || !toAsset || !fromChain || !fromChainProvider || !toChain || !maxRewardWei) {
      throw new Error('All primary parameters must be provided and valid.')
    }
    if (executorTipOption === 'custom' && !customExecutorTipValue && !customExecutorTipPercentage) {
      throw new Error(
        'Received custom executor tip option but missing customExecutorTipValue or customExecutorTipPercentage.',
      )
    }
    if (overpayOption === 'custom' && !customOverpayRatio) {
      throw new Error('Received custom overpay option but missing customOverpayRatio.')
    }
    if (slippageOption === 'custom' && !customSlippage) {
      throw new Error('Received custom slippage option but missing customSlippage.')
    }

    if (executorTipOption === 'custom' && customExecutorTipValue) {
      maxRewardWei = maxRewardWei.sub(customExecutorTipValue)
    } else {
      let executorTipAdjustment = 0
      switch (executorTipOption) {
        case 'low':
          executorTipAdjustment = 0.95 // Give less tip, so lose less (more reward left)
          break
        case 'high':
          executorTipAdjustment = 1.05 // Give more tip, so lose more (less reward left)
          break
        default:
          executorTipAdjustment = 1 // 'regular' or 'custom' with percentage handling below
          break
      }
      if (executorTipOption === 'custom' && customExecutorTipPercentage) {
        executorTipAdjustment = 1 + customExecutorTipPercentage / 100
      }
      maxRewardWei = maxRewardWei.div(BigNumber.from(Math.round(executorTipAdjustment * 100))).mul(100)
    }

    // Overpay Adjustment
    let overpayAdjustment = 1
    switch (overpayOption) {
      case 'slow':
        overpayAdjustment = 1.05 // Spend more for less speed (less reward left)
        break
      case 'fast':
        overpayAdjustment = 1.2 // Spend much more for more speed (much less reward left)
        break
      case 'custom':
        overpayAdjustment = customOverpayRatio || 1 // Custom overpay, potentially no adjustment
        break
      default:
        overpayAdjustment = 1.1 // 'regular'
        break
    }
    maxRewardWei = maxRewardWei.div(BigNumber.from(Math.round(overpayAdjustment * 100))).mul(100)

    // Slippage Adjustment
    let slippageAdjustment = 1
    switch (slippageOption) {
      case 'zero':
        slippageAdjustment = 1.0 // No slippage
        break
      case 'high':
        slippageAdjustment = 1.05 // Allow for more slippage (less reward left)
        break
      case 'custom':
        slippageAdjustment = customSlippage || 1 // Custom slippage, potentially no adjustment
        break
      default:
        slippageAdjustment = 1.02 // 'regular'
        break
    }
    maxRewardWei = maxRewardWei.div(BigNumber.from(Math.round(slippageAdjustment * 100))).mul(100)

    // Calculate the final amount after all adjustments
    const {
      estimatedReceivedAmountWei,
      gasFeeWei,
      bridgeFeeWei,
      estimatedReceivedAmountUSD,
      gasFeeUSD,
      bridgeFeeUSD,
      BRNbonusUSD,
    } = await this.estimateReceivedAmount(fromAsset, toAsset, fromChain, fromChainProvider, toChain, maxRewardWei)

    return {
      estimatedReceivedAmountWei,
      gasFeeWei,
      bridgeFeeWei,
      estimatedReceivedAmountUSD,
      gasFeeUSD,
      bridgeFeeUSD,
      BRNbonusUSD,
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
    const usdPrice = await this.priceCache.getPriceFromCacheServer(assetObj.asset, network, assetObj.address)

    if (!usdPrice) {
      throw new Error('Failed to fetch price for asset from proxy server')
    }

    this.priceCache.set(assetObj.asset, network, usdPrice)
    return usdPrice
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
  async receiveAssetPriceWithCache(
    asset: SupportedAssetPriceProvider,
    networkId: NetworkNameOnPriceProvider,
  ): Promise<BigNumber> {
    const { assetObject } = this.getAssetObject(asset, networkId)

    if (assetObject instanceof BigNumber) {
      return assetObject
    }

    let price = await this.priceCache.get(asset, assetObject.network, assetObject)
    if (price) {
      return this.parsePriceStringToBigNumberOn18Decimals(price)
    }

    try {
      price = await this.fetchPriceAndStoreInCache(assetObject, assetObject.network)
    } catch (err: any) {
      logger.error(
        {
          asset,
          networkId,
          err: err.message,
          cache: JSON.stringify(this.priceCache.getWholeCache()),
        },
        `🅰️ Failed to fetch price for asset from proxy server. Return zero.`,
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
  async calculatePricingAssetAinB(
    assetA: SupportedAssetPriceProvider,
    assetB: SupportedAssetPriceProvider,
    priceA: BigNumber,
    priceB: BigNumber,
    destinationNetwork: NetworkNameOnPriceProvider,
  ): Promise<PriceResult> {
    let priceAInUsd
    let priceBInUsd
    const priceAinB = this.calculatePriceAinBOn18Decimals(priceA, priceB)
    const assetObjA = this.getAssetObject(assetA, destinationNetwork)
    const assetObjB = this.getAssetObject(assetB, destinationNetwork)
    if (assetObjA.assetObject instanceof BigNumber) {
      priceAInUsd = assetObjA.assetObject.toString()
    } else {
      priceAInUsd = (await this.priceCache.get(assetA, assetObjA.assetObject.network, assetObjA.assetObject)) || '0'
    }

    if (assetObjB.assetObject instanceof BigNumber) {
      priceBInUsd = assetObjB.assetObject.toString()
    } else {
      priceBInUsd = (await this.priceCache.get(assetB, assetObjB.assetObject.network, assetObjB.assetObject)) || '0'
    }

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
    const gasLimit = ofTokenTransfer === ethers.constants.AddressZero ? ETH_TRANSFER_GAS_LIMIT : ERC20_GAS_LIMIT
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
