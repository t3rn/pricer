import { expect } from 'chai'
import config from '../../../src/config/config'
import { BigNumber, ethers } from 'ethers'
import { Order } from '../../../src/types'
import { Pricer } from '../../../src/pricer/pricer.service'
import { CostResult, PriceResult } from '../../../src/pricer/types'
import { networkNameCircuitToPriceProvider, NetworkNameOnCircuit } from '../../../src/config/circuit-assets'
import {
  NetworkNameOnPriceProvider,
  SupportedAssetPriceProvider,
  networkToAssetAddressOnPriceProviderMap,
} from '../../../src/config/price-provider-assets'
import { OrderArbitrageStrategy } from '../../../src/pricer/pricer.service'
import { describe, it, beforeEach } from 'mocha'
import sinon from 'sinon'

describe('Pricer', () => {
  const pricer = new Pricer({
    tokens: {
      addressZero: '0x0000000000000000000000000000000000000000',
      oneOn18Decimals: parseInt('1000000000000000000'),
      maxDecimals18: 18,
    },
    pricer: {
      useMultichain: true,
      cleanupIntervalSec: 60,
      proxyServerUrl: '',
    },
  })

  it('should correctly evaluate value of assets in USD out of cache', async () => {
    const asset = SupportedAssetPriceProvider.ETH
    const network = 'eth'
    const ethPrice = '1980.861883676755965'

    // Mock cache setup
    pricer.priceCache.set(asset, network, ethPrice)

    const zeroPointOneEth = BigNumber.from('100000000000000000')
    const usdValueA = await pricer.receiveAssetUSDValue(asset, network, zeroPointOneEth)
    expect(usdValueA).to.equal(198.086188367675589461)
  })

  it('should correctly calculate prices out of API keeping ALWAYS 18 DECIMALS convention', () => {
    // Mock data setup
    const exampleAPrice = '1.102723238337682431'
    const exampleBPrice = '0.907273238337682431'
    const exampleCPrice = '1980.861883676755965'

    const exampleAPriceInBigNumber = pricer.parsePriceStringToBigNumberOn18Decimals(exampleAPrice)
    expect(exampleAPriceInBigNumber.toString()).to.equal('1102723238337682431')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber)).to.equal(1.102723238337682431)

    const exampleBPriceInBigNumber = pricer.parsePriceStringToBigNumberOn18Decimals(exampleBPrice)
    expect(exampleBPriceInBigNumber.toString()).to.equal('907273238337682431')
    expect(Pricer.priceAsFloat(exampleBPriceInBigNumber)).to.equal(0.907273238337682431)

    const exampleCPriceInBigNumber = pricer.parsePriceStringToBigNumberOn18Decimals(exampleCPrice)
    expect(exampleCPriceInBigNumber.toString()).to.equal('1980861883676755965000')
    expect(Pricer.priceAsFloat(exampleCPriceInBigNumber)).to.equal(1980.861883676755965)

    const exampleAPriceInBigNumberA = pricer.calculatePriceAinBOn18Decimals(
      exampleAPriceInBigNumber,
      exampleAPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumberA.toString()).to.equal('1000000000000000000')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumberA)).to.equal(1)

    const exampleAPriceInBigNumber2 = pricer.calculatePriceAinBOn18Decimals(
      exampleAPriceInBigNumber,
      exampleBPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber2.toString()).to.equal('1215425730354513700')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber2)).to.equal(1.2154257303545137)

    const exampleAPriceInBigNumber3 = pricer.calculatePriceAinBOn18Decimals(
      exampleAPriceInBigNumber,
      exampleCPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber3.toString()).to.equal('556688604806143')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber3)).to.equal(0.000556688604806143)

    const exampleAPriceInBigNumber4 = pricer.calculatePriceAinBOn18Decimals(
      exampleBPriceInBigNumber,
      exampleAPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber4.toString()).to.equal('822756977267810000')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber4)).to.equal(0.82275697726781)

    const exampleAPriceInBigNumber5 = pricer.calculatePriceAinBOn18Decimals(
      exampleBPriceInBigNumber,
      exampleBPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber5.toString()).to.equal('1000000000000000000')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber5)).to.equal(1)

    const exampleAPriceInBigNumber6 = pricer.calculatePriceAinBOn18Decimals(
      exampleBPriceInBigNumber,
      exampleCPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber6.toString()).to.equal('458019433769737')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber6)).to.equal(0.000458019433769737)

    const exampleAPriceInBigNumber7 = pricer.calculatePriceAinBOn18Decimals(
      exampleCPriceInBigNumber,
      exampleAPriceInBigNumber,
    )
    expect(exampleAPriceInBigNumber7.toString()).to.equal('1796336392314392200000')
    expect(Pricer.priceAsFloat(exampleAPriceInBigNumber7)).to.equal(1796.3363923143922)
  })

  it('should correctly calculate gas costs of ERC-20 in target asset pricing', () => {
    const priceAssetCache = '1.102723238337682431'
    const asset = 'optimism'
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceInGwei = BigNumber.from('20')
    const estGasPriceOnNativeInWei = estGasPriceInGwei.mul(BigNumber.from('1000000000'))
    const ofToken = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'

    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)
    expect(costResult.costInWei.toString()).to.equal('1000000000000000')
    expect(costResult.costInEth).to.equal('0.001000000000000000')
    expect(costResult.costInUsd).to.equal(1.980861883676756)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('1796336392314392238')
    expect(Pricer.priceAsFloat(costResult.costInAsset)).to.equal(1.7963363923143922)
  })

  it('should correctly calculate gas costs of native transfer in target asset pricing', () => {
    const priceAssetCache = '1.102723238337682431'
    const asset = 'optimism'
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceInGwei = BigNumber.from('20')
    const estGasPriceOnNativeInWei = estGasPriceInGwei.mul(BigNumber.from('1000000000'))
    const ofToken = '0x0000000000000000000000000000000000000000'

    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)
    expect(costResult.costInWei.toString()).to.equal('420000000000000')
    expect(costResult.costInEth).to.equal('0.000420000000000000')
    expect(costResult.costInUsd).to.equal(0.8319619911442375)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('754461284772044771')
    expect(Pricer.priceAsFloat(costResult.costInAsset)).to.equal(0.7544612847720448)
  })

  it('should correctly evaluate non-profitable deal based on example cost and pricing', async () => {
    const destination: NetworkNameOnCircuit = 'bscp'
    const priceAssetCache = '1.102723238337682431'
    const asset = SupportedAssetPriceProvider.OPTIMISM
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceInGwei = BigNumber.from('20')
    const estGasPriceOnNativeInWei = estGasPriceInGwei.mul(BigNumber.from('1000000000'))
    const ofToken = '0x0000000000000000000000000000000000000000'

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from('1'),
      minProfitRate: 1,
      maxAmountPerOrder: BigNumber.from('500'),
      minAmountPerOrder: BigNumber.from('5'),
      maxShareOfMyBalancePerOrder: 50,
    }

    const order: Order = {
      id: '1',
      destination,
      source: 'sepl',
      asset: 1,
      assetNative: false,
      assetAddress: config.tokens.addressZero,
      targetAccount: 'someAccount',
      amount: BigNumber.from('100'),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: BigNumber.from('112'),
      nonce: 0,
      txHash: '0xasdf123',
    }

    const myBalance1Eth = ethers.utils.parseEther('1')
    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    expect(Pricer.priceAsFloat(priceAsset)).to.equal(1.1027232383376824)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    expect(Pricer.priceAsFloat(priceNative)).to.equal(1980.861883676756)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)

    expect(costResult.costInWei.toString()).to.equal('420000000000000')
    expect(costResult.costInEth).to.equal('0.000420000000000000')
    expect(costResult.costInUsd).to.equal(0.8319619911442375)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('754461284772044771')
    const pricingResult = await pricer.calculatePricingAssetAinB(
      SupportedAssetPriceProvider.ETH,
      asset,
      priceAsset,
      priceNative,
      networkNameCircuitToPriceProvider[destination],
    )
    expect(pricingResult.priceAinB.toString()).to.equal('556688604806143')
    expect(Pricer.priceAsFloat(pricingResult.priceAinB)).to.equal(0.000556688604806143)
    const evalDealResult = pricer.evaluateDeal(myBalance1Eth, costResult, strategy, order, pricingResult)

    expect(evalDealResult.isProfitable).to.equal(false)
    expect(evalDealResult.loss.toString()).to.equal('-754461284772044871')
    expect(Pricer.priceAsFloat(evalDealResult.loss)).to.equal(-0.7544612847720449)
    expect(evalDealResult.profit.toString()).to.equal('0')
  })

  it('should correctly evaluate deal as profitable based on todays optimism gas cost and pricing on big 1mln wallet', async () => {
    const destination: NetworkNameOnCircuit = 'bscp'
    const priceAssetCache = '233.238337682431'
    const asset = SupportedAssetPriceProvider.BSC
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceOnNativeInWei = ethers.utils.parseUnits('14.6868125', 'gwei')
    const ofToken = '0x0000000000000000000000000000000000000002'

    const myBalance1MlnEth = ethers.utils.parseEther('1000000')
    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    expect(Pricer.priceAsFloat(priceAsset)).to.equal(233.238337682431)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    expect(Pricer.priceAsFloat(priceNative)).to.equal(1980.861883676756)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)

    expect(costResult.costInUsd).to.equal(1.4546273536978662)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('6236656323963494')
    const pricingResult = await pricer.calculatePricingAssetAinB(
      SupportedAssetPriceProvider.ETH,
      asset,
      priceAsset,
      priceNative,
      networkNameCircuitToPriceProvider[destination],
    )
    expect(pricingResult.priceAinB.toString()).to.equal('117745886073343030')
    expect(Pricer.priceAsFloat(pricingResult.priceAinB)).to.equal(0.11774588607334302)

    // Increase costResult.costInAsset by 20% to make it profitable

    const priceBinA = pricer.calculatePriceAinBOn18Decimals(priceNative, priceAsset)
    // const maxAmountPerOrderAllowance = costResult.costInAsset.mul(BigNumber.from("12")).div(BigNumber.from("10")).div(pricingResult.priceAinB).mul(BigNumber.from(10).pow(MAX_DECIMALS_18));
    const maxAmountPerOrderAllowance = BigNumber.from((config.tokens.oneOn18Decimals * 0.1).toString())
      .mul(BigNumber.from('12'))
      .div(BigNumber.from('10'))
      .mul(priceBinA)
      .div(BigNumber.from(10).pow(config.tokens.maxDecimals18))
    const maxRewardAdjustedToCoverCosts = maxAmountPerOrderAllowance

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from((0.1 * config.tokens.oneOn18Decimals * 0.001).toString()),
      minProfitRate: 0.0000001,
      maxAmountPerOrder: BigNumber.from((10 * config.tokens.oneOn18Decimals).toString()),
      minAmountPerOrder: BigNumber.from((0.1 * config.tokens.oneOn18Decimals).toString()),
      maxShareOfMyBalancePerOrder: 25,
    }
    const order: Order = {
      id: '1',
      destination,
      source: 'sepl',
      asset: 1,
      assetAddress: config.tokens.addressZero,
      assetNative: false,
      targetAccount: 'someAccount',
      amount: BigNumber.from((config.tokens.oneOn18Decimals * 0.1).toString()),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: maxRewardAdjustedToCoverCosts,
      nonce: 0,
      txHash: '0xasdf123',
    }

    const evalDealResult = pricer.evaluateDeal(myBalance1MlnEth, costResult, strategy, order, pricingResult)

    expect(evalDealResult.isProfitable).to.equal(true)
    expect(evalDealResult.loss.toString()).to.equal('0')
    expect(Pricer.priceAsFloat(evalDealResult.profit)).to.equal(0.013763343676036491)
    expect(evalDealResult.profit.toString()).to.equal('13763343676036492')
  })

  it('should correctly evaluate deal as profitable based on todays optimism gas cost and pricing', async () => {
    const destination: NetworkNameOnCircuit = 'bscp'
    const priceAssetCache = '233.238337682431'
    const asset = SupportedAssetPriceProvider.BSC
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceOnNativeInWei = ethers.utils.parseUnits('14.6868125', 'gwei')
    const ofToken = '0x0000000000000000000000000000000000000002'

    const myBalance1Eth = ethers.utils.parseEther('1')
    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    expect(Pricer.priceAsFloat(priceAsset)).to.equal(233.238337682431)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    expect(Pricer.priceAsFloat(priceNative)).to.equal(1980.861883676756)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)

    expect(costResult.costInUsd).to.equal(1.4546273536978662)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('6236656323963494')
    const pricingResult = await pricer.calculatePricingAssetAinB(
      SupportedAssetPriceProvider.ETH,
      asset,
      priceAsset,
      priceNative,
      networkNameCircuitToPriceProvider[destination],
    )
    expect(pricingResult.priceAinB.toString()).to.equal('117745886073343030')
    expect(Pricer.priceAsFloat(pricingResult.priceAinB)).to.equal(0.11774588607334302)

    // Increase costResult.costInAsset by 20% to make it profitable

    const priceBinA = pricer.calculatePriceAinBOn18Decimals(priceNative, priceAsset)
    // const maxAmountPerOrderAllowance = costResult.costInAsset.mul(BigNumber.from("12")).div(BigNumber.from("10")).div(pricingResult.priceAinB).mul(BigNumber.from(10).pow(config.misc.maxDecimals18));
    const maxAmountPerOrderAllowance = costResult.costInAsset
      .mul(BigNumber.from('12'))
      .div(BigNumber.from('10'))
      .mul(priceBinA)
      .div(BigNumber.from(10).pow(config.tokens.maxDecimals18))
    const maxRewardAdjustedToCoverCosts = maxAmountPerOrderAllowance

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from('1'),
      minProfitRate: 0.1,
      maxAmountPerOrder: maxAmountPerOrderAllowance,
      minAmountPerOrder: BigNumber.from('5'),
      maxShareOfMyBalancePerOrder: 50,
    }

    const order: Order = {
      id: '1',
      destination,
      source: 'sepl',
      asset: 1,
      assetAddress: config.tokens.addressZero,
      assetNative: false,
      targetAccount: 'someAccount',
      amount: BigNumber.from('100'),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: maxRewardAdjustedToCoverCosts,
      nonce: 0,
      txHash: '0xasdf123',
    }

    const evalDealResult = pricer.evaluateDeal(myBalance1Eth, costResult, strategy, order, pricingResult)

    expect(evalDealResult.isProfitable).to.equal(true)
    expect(evalDealResult.loss.toString()).to.equal('0')
    expect(Pricer.priceAsFloat(evalDealResult.profit)).to.equal(0.001247331264792597)
    expect(evalDealResult.profit.toString()).to.equal('1247331264792597')
  })

  it('should correctly calculate gas costs of native transfer in for same assets pricing', () => {
    const priceAssetCache = '1980.861883676755965'
    const asset = 'ethereum'
    const priceNativeCache = '1980.861883676755965'
    const estGasPriceInGwei = BigNumber.from('20')
    const estGasPriceOnNativeInWei = estGasPriceInGwei.mul(BigNumber.from('1000000000'))
    const ofToken = '0x0000000000000000000000000000000000000000'

    const priceAsset = pricer.parsePriceStringToBigNumberOn18Decimals(priceAssetCache)
    const priceNative = pricer.parsePriceStringToBigNumberOn18Decimals(priceNativeCache)
    const costResult = pricer.calculateCostInAsset(asset, priceAsset, priceNative, estGasPriceOnNativeInWei, ofToken)
    expect(costResult.costInWei.toString()).to.equal('420000000000000')
    expect(costResult.costInEth).to.equal('0.000420000000000000')
    expect(costResult.costInUsd).to.equal(0.8319619911442375)
    expect(costResult.asset).to.equal(asset)
    expect(costResult.costInAsset.toString()).to.equal('420000000000000')
    expect(Pricer.priceAsFloat(costResult.costInAsset)).to.equal(0.00042)
  })

  it('should correctly evaluate the profitability of an order', () => {
    // Mock data setup
    const myBalance: BigNumber = BigNumber.from('1000')
    const costOfExecutionOnTarget: CostResult = {
      costInWei: BigNumber.from('2'),
      costInEth: '0.000000000000000002',
      costInUsd: 0.000000000000000002,
      costInAsset: BigNumber.from('2'),
      asset: 'testAsset',
    }

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from('5'),
      minProfitRate: 0.1, // 0.1% of 1000 balance sets the min profit to 1 wei
      maxAmountPerOrder: BigNumber.from('500'),
      minAmountPerOrder: BigNumber.from('5'),
      maxShareOfMyBalancePerOrder: 50,
    }

    const order: Order = {
      id: '1',
      destination: 'bscp',
      source: 'sepl',
      asset: 1,
      assetAddress: config.tokens.addressZero,
      assetNative: false,
      targetAccount: 'someAccount',
      amount: BigNumber.from('100'),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: BigNumber.from('110'),
      nonce: 0,
      txHash: '0xasdf123',
    }

    const pricing: PriceResult = {
      assetA: 'testA',
      assetB: 'testB',
      priceAinB: BigNumber.from('1000000000000000000'),
      priceAInUsd: '0.1',
      priceBInUsd: '0.1',
    }
    // Evaluate the deal
    const result = pricer.evaluateDeal(myBalance, costOfExecutionOnTarget, strategy, order, pricing)
    // Assertions
    expect(result.isProfitable).to.be.true
    expect(result.profit.toString()).to.equal('8')
    expect(result.loss.toString()).to.equal('0')
  })

  it('should correctly evaluate the non-profitable order', () => {
    // Mock data setup
    const myBalance: BigNumber = BigNumber.from('1000')

    const costOfExecutionOnTarget: CostResult = {
      costInWei: BigNumber.from('2'),
      costInEth: '0.000000000000000002',
      costInUsd: 0.000000000000000002,
      costInAsset: BigNumber.from('2'),
      asset: 'testAsset',
    }

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from('5'),
      minProfitRate: 0.001,
      maxAmountPerOrder: BigNumber.from('500'),
      minAmountPerOrder: BigNumber.from('5'),
      maxShareOfMyBalancePerOrder: 50,
    }

    const order: Order = {
      id: '1',
      destination: 'bscp',
      source: 'sepl',
      asset: 1,
      assetAddress: config.tokens.addressZero,
      assetNative: false,
      targetAccount: 'someAccount',
      amount: BigNumber.from('100'),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: BigNumber.from('102'),
      nonce: 0,
      txHash: '0xasdf123',
    }

    const pricing: PriceResult = {
      assetA: 'testA',
      assetB: 'testB',
      priceAinB: BigNumber.from('1000000000000000000'),
      priceAInUsd: '0.1',
      priceBInUsd: '0.1',
    }

    // Evaluate the deal
    const result = pricer.evaluateDeal(myBalance, costOfExecutionOnTarget, strategy, order, pricing)
    // Assertions
    expect(result.isProfitable).to.be.false
    expect(result.profit.toString()).to.equal('0')
    expect(result.loss.toString()).to.equal('0')
  })

  it('should correctly evaluate the non-profitable order and show the expected loss', () => {
    // Mock data setup
    const myBalance: BigNumber = BigNumber.from('1000')

    const costOfExecutionOnTarget: CostResult = {
      costInWei: BigNumber.from('5'),
      costInEth: '0.000000000000000002',
      costInUsd: 0.000000000000000002,
      costInAsset: BigNumber.from('5'),
      asset: 'testAsset',
    }

    const strategy: OrderArbitrageStrategy = {
      minProfitPerOrder: BigNumber.from('5'),
      minProfitRate: 10,
      maxAmountPerOrder: BigNumber.from('500'),
      minAmountPerOrder: BigNumber.from('5'),
      maxShareOfMyBalancePerOrder: 50,
    }

    const order: Order = {
      id: '1',
      destination: 'bscp',
      source: 'sepl',
      asset: 1,
      assetAddress: config.tokens.addressZero,
      assetNative: false,
      targetAccount: 'someAccount',
      amount: BigNumber.from('100'),
      rewardAsset: '2',
      insurance: BigNumber.from('1'),
      maxReward: BigNumber.from('102'),
      nonce: 0,
      txHash: '0xasdf123',
    }

    const pricing: PriceResult = {
      assetA: 'testA',
      assetB: 'testB',
      priceAinB: BigNumber.from('1000000000000000000'),
      priceAInUsd: '0.1',
      priceBInUsd: '0.1',
    }

    // Evaluate the deal
    const result = pricer.evaluateDeal(myBalance, costOfExecutionOnTarget, strategy, order, pricing)
    // Assertions
    expect(result.isProfitable).to.be.false
    expect(result.profit.toString()).to.equal('0')
    expect(result.loss.toString()).to.equal('-3')
  })

  describe('assessDealForPublication', () => {
    let overpayOption: string, slippageOption: string
    let userBalance: BigNumber
    let estimatedCost: CostResult
    let userStrategy: { maxSpendLimit: BigNumber }
    let marketPricing: PriceResult

    beforeEach(() => {
      userBalance = BigNumber.from('1100000000000000000') // 1 ETH
      estimatedCost = {
        costInWei: BigNumber.from('0'),
        costInEth: '0',
        costInUsd: 0,
        costInAsset: BigNumber.from('200000000000000'), // 0.0002 ETH
        asset: 'testAsset',
      }
      userStrategy = { maxSpendLimit: BigNumber.from('1100000000000000000') } // 1.1 ETH
      marketPricing = {
        assetA: 'testA',
        assetB: 'testB',
        priceAinB: BigNumber.from('1000000000000000000'),
        priceAInUsd: '0.1',
        priceBInUsd: '0.1',
      }
    })

    it('should assess a deal as publishable with regular overpay and regular slippage', () => {
      overpayOption = 'regular'
      slippageOption = 'regular'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        undefined,
        undefined,
      )

      expect(result.isPublishable).to.be.true
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('1.02022') // expect 1.02022 ETH
    })

    it('should return a non-publishable deal when user balance is insufficient', () => {
      userBalance = BigNumber.from('1000000000000000000') // 1 ETH
      estimatedCost.costInAsset = BigNumber.from('1000000000000000000') // 1 ETH
      estimatedCost.costInWei = BigNumber.from('1000000000000000000') // 1 ETH
      estimatedCost.costInEth = '1.0'
      estimatedCost.costInUsd = 2000
      estimatedCost.asset = 'ETH'
      userStrategy.maxSpendLimit = BigNumber.from('500000000000000000') // 0.5 ETH
      overpayOption = 'regular'
      slippageOption = 'regular'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
      )

      expect(result.isPublishable).to.be.false
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('2.12')
    })

    it('should assess a deal as publishable with slow overpay and zero slippage', () => {
      overpayOption = 'slow'
      slippageOption = 'zero'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        undefined,
        undefined,
      )

      expect(result.isPublishable).to.be.true
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('1.00021') // expect 1.00021 ETH
    })

    it('should assess a deal as non-publishable with custom overpay and high slippage', () => {
      userBalance = BigNumber.from('1000000000000000000') // 1 ETH
      userStrategy.maxSpendLimit = BigNumber.from('1100000000000000000') // 1.1 ETH
      overpayOption = 'custom'
      slippageOption = 'high'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        1.5, // customOverpayRatio
        1.1, // customSlippage
      )

      expect(result.isPublishable).to.be.false
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('1.0503')
    })

    it('should assess a deal as publishable with fast overpay and high slippage', () => {
      userBalance = BigNumber.from('1300000000000000000') // 1.3 ETH
      userStrategy.maxSpendLimit = BigNumber.from('1100000000000000000') // 1.1 ETH
      overpayOption = 'fast'
      slippageOption = 'high'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        undefined,
        undefined,
      )

      expect(result.isPublishable).to.be.true
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('1.05024')
    })

    it('should assess a deal as non-publishable with custom overpay and zero slippage', () => {
      userStrategy.maxSpendLimit = BigNumber.from('1000000000000000000') // 1 ETH
      overpayOption = 'custom'
      slippageOption = 'zero'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        1.5, // customOverpayRatio
        undefined,
      )

      expect(result.isPublishable).to.be.false
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('0.0')
    })

    it('should assess a deal as non-publishable with regular overpay and custom slippage', () => {
      userStrategy.maxSpendLimit = BigNumber.from('1100000000000000000') // 1.1 ETH
      overpayOption = 'regular'
      slippageOption = 'custom'

      const result = pricer.assessDealForPublication(
        userBalance,
        estimatedCost,
        userStrategy,
        marketPricing,
        overpayOption as 'regular' | 'custom' | 'slow' | 'fast',
        slippageOption as 'zero' | 'regular' | 'high' | 'custom',
        undefined,
        1.2, // customSlippage
      )

      expect(result.isPublishable).to.be.false
      expect(ethers.utils.formatEther(result.maxReward.toString())).to.equal('1.20022')
    })
  })

  describe('proposeDealForSetAmount', () => {
    it('should propose a deal for a set amount', () => {
      const balance = BigNumber.from(ethers.utils.parseEther('1').toString())
      const costOfExecutionOnDestination = {
        costInWei: BigNumber.from(ethers.utils.parseUnits('0.001', 'ether').toString()),
        costInEth: '0.001',
        costInUsd: 1.98,
        asset: 'optimism',
        costInAsset: BigNumber.from(ethers.utils.parseEther('1.8').toString()),
      }
      const strategy = {
        minProfitPerOrder: BigNumber.from(ethers.utils.parseEther('0.01').toString()),
        minProfitRate: 1,
        maxAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.5').toString()),
        minAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.005').toString()),
        maxShareOfMyBalancePerOrder: 50,
      }
      const order: Order = {
        id: '1',
        destination: 'bscp',
        source: 'sepl',
        asset: 1,
        assetNative: false,
        assetAddress: '0x0000000000000000000000000000000000000000',
        targetAccount: 'someAccount',
        amount: BigNumber.from(ethers.utils.parseEther('0.1').toString()),
        rewardAsset: '2',
        insurance: BigNumber.from(ethers.utils.parseEther('0.001').toString()),
        maxReward: BigNumber.from(ethers.utils.parseEther('0.112').toString()),
        nonce: 0,
        txHash: '0xasdf123',
      }
      const pricing = {
        assetA: 'optimism',
        assetB: 'bscp',
        priceAinB: BigNumber.from(ethers.utils.parseEther('0.556').toString()),
        priceAInUsd: '0',
        priceBInUsd: '0',
      }

      const result = pricer.proposeDealForSetAmount(balance, costOfExecutionOnDestination, strategy, order, pricing)

      expect(result.profitability.isProfitable).to.equal(false)
      expect(result.profitability.profit.toString()).to.equal('0')
      expect(ethers.utils.formatEther(result.profitability.loss.toString())).to.equal('-1.837728')
      expect(result.assumedCost).to.equal(costOfExecutionOnDestination)
      expect(result.assumedPrice).to.equal(pricing)
      expect(result.rewardAsset).to.equal(order.rewardAsset)
      expect(result.orderAsset).to.equal(order.assetAddress)
      expect(result.costOverpaymentPercent).to.equal(0)
      expect(result.setAmount).to.equal(order.amount)
      expect(ethers.utils.formatEther(result.proposedMaxReward.toString())).to.equal('1.9')
    })

    it('should propose an unprofitable deal for a set amount', () => {
      const balance = BigNumber.from(ethers.utils.parseEther('1').toString()) // 1 ETH
      const costOfExecutionOnDestination = {
        costInWei: BigNumber.from(ethers.utils.parseUnits('0.0005', 'ether').toString()),
        costInEth: '0.000500000000000000',
        costInUsd: 0.99,
        asset: 'optimism',
        costInAsset: BigNumber.from(ethers.utils.parseEther('0.00001').toString()),
      }
      const strategy = {
        minProfitPerOrder: BigNumber.from(ethers.utils.parseEther('0.00000001').toString()),
        minProfitRate: 1,
        maxAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.2').toString()),
        minAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.005').toString()),
        maxShareOfMyBalancePerOrder: 50,
      }
      const order: Order = {
        id: '2',
        destination: 'bscp',
        source: 'sepl',
        asset: 1,
        assetNative: false,
        assetAddress: '0x0000000000000000000000000000000000000000',
        targetAccount: 'someAccount',
        amount: BigNumber.from(ethers.utils.parseEther('0.2').toString()),
        rewardAsset: '2',
        insurance: BigNumber.from(ethers.utils.parseEther('0.000001').toString()),
        maxReward: BigNumber.from(ethers.utils.parseEther('5.56688604806143').toString()),
        nonce: 0,
        txHash: '0xasdf123',
      }
      const pricing = {
        assetA: 'optimism',
        assetB: 'bscp',
        priceAinB: BigNumber.from(ethers.utils.parseEther('1').toString()),
        priceAInUsd: '1.0',
        priceBInUsd: '1.0',
      }

      const result = pricer.proposeDealForSetAmount(balance, costOfExecutionOnDestination, strategy, order, pricing)

      expect(result.profitability.isProfitable).to.equal(false)
      expect(result.profitability.profit.toString()).to.equal('0')
      expect(ethers.utils.formatEther(result.profitability.loss)).to.equal('5.36687604806143')
      expect(result.assumedCost).to.equal(costOfExecutionOnDestination)
      expect(result.assumedPrice).to.equal(pricing)
      expect(result.rewardAsset).to.equal(order.rewardAsset)
      expect(result.orderAsset).to.equal(order.assetAddress)
      expect(result.costOverpaymentPercent).to.equal(0)
      expect(result.setAmount).to.equal(order.amount)
      expect(ethers.utils.formatEther(result.proposedMaxReward)).to.equal('0.20001')
    })

    it('should propose a deal with cost overpayment for a set amount', () => {
      const balance = BigNumber.from(ethers.utils.parseEther('1').toString())
      const costOfExecutionOnDestination = {
        costInWei: BigNumber.from(ethers.utils.parseUnits('0.0015', 'ether').toString()),
        costInEth: '0.001500000000000000',
        costInUsd: 2.97,
        asset: 'optimism',
        costInAsset: BigNumber.from(ethers.utils.parseEther('2.694504583466588357').toString()),
      }
      const strategy = {
        minProfitPerOrder: BigNumber.from(ethers.utils.parseEther('0.00000001').toString()),
        minProfitRate: 1,
        maxAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.5').toString()),
        minAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.005').toString()),
        maxShareOfMyBalancePerOrder: 50,
      }
      const order: Order = {
        id: '3',
        destination: 'bscp',
        source: 'sepl',
        asset: 1,
        assetNative: false,
        assetAddress: '0x0000000000000000000000000000000000000000',
        targetAccount: 'someAccount',
        amount: BigNumber.from(ethers.utils.parseEther('0.3').toString()),
        rewardAsset: '2',
        insurance: BigNumber.from(ethers.utils.parseEther('0.000001').toString()),
        maxReward: BigNumber.from(ethers.utils.parseEther('0.112').toString()),
        nonce: 0,
        txHash: '0xasdf123',
      }
      const pricing = {
        assetA: 'optimism',
        assetB: 'bscp',
        priceAinB: BigNumber.from(ethers.utils.parseEther('0.556688604806143').toString()),
        priceAInUsd: '0',
        priceBInUsd: '0',
      }

      const result = pricer.proposeDealForSetAmount(balance, costOfExecutionOnDestination, strategy, order, pricing)

      expect(result.profitability.isProfitable).to.equal(false)
      expect(result.profitability.profit.toString()).to.equal('0')
      expect(ethers.utils.formatEther(result.profitability.loss)).to.equal('-2.932155459728300341')
      expect(result.assumedCost).to.equal(costOfExecutionOnDestination)
      expect(result.assumedPrice).to.equal(pricing)
      expect(result.rewardAsset).to.equal(order.rewardAsset)
      expect(result.orderAsset).to.equal(order.assetAddress)
      expect(result.costOverpaymentPercent).to.equal(0)
      expect(result.setAmount).to.equal(order.amount)
      expect(ethers.utils.formatEther(result.proposedMaxReward)).to.equal('2.994504583466588357')
    })

    it('should propose a profitable deal for a set amount', () => {
      const balance = BigNumber.from(ethers.utils.parseEther('1').toString()) // 1 ETH
      const costOfExecutionOnDestination = {
        costInWei: BigNumber.from(ethers.utils.parseUnits('0.001', 'ether').toString()),
        costInEth: '0.001',
        costInUsd: 2,
        asset: 'optimism',
        costInAsset: BigNumber.from(ethers.utils.parseEther('0.001').toString()),
      }
      const strategy = {
        minProfitPerOrder: BigNumber.from(ethers.utils.parseEther('0.0001').toString()), // min profit of 0.0001 ETH
        minProfitRate: 1, // min profit rate of 1%
        maxAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.5').toString()), //  0.5 ETH
        minAmountPerOrder: BigNumber.from(ethers.utils.parseEther('0.01').toString()), //  0.01 ETH
        maxShareOfMyBalancePerOrder: 50, // 50% of balance per order
      }
      const order: Order = {
        id: '4',
        destination: 'bscp',
        source: 'sepl',
        asset: 1,
        assetNative: false,
        assetAddress: '0x0000000000000000000000000000000000000000',
        targetAccount: 'someAccount',
        amount: BigNumber.from(ethers.utils.parseEther('0.2').toString()),
        rewardAsset: '2',
        insurance: BigNumber.from(ethers.utils.parseEther('0.0001').toString()),
        maxReward: BigNumber.from(ethers.utils.parseEther('0.3').toString()), // 0.3 ETH
        nonce: 0,
        txHash: '0xasdf123',
      }
      const pricing = {
        assetA: 'optimism',
        assetB: 'bscp',
        priceAinB: BigNumber.from(ethers.utils.parseEther('1').toString()), // 1:1 price ratio for simplicity
        priceAInUsd: '1.0',
        priceBInUsd: '1.0',
      }

      const result = pricer.proposeDealForSetAmount(balance, costOfExecutionOnDestination, strategy, order, pricing)

      expect(result.profitability.isProfitable).to.equal(true)
      expect(ethers.utils.formatEther(result.profitability.profit)).to.equal('0.099') // expected profit of 0.099 ETH
      expect(result.profitability.loss.toString()).to.equal('0')
      expect(result.assumedCost).to.equal(costOfExecutionOnDestination)
      expect(result.assumedPrice).to.equal(pricing)
      expect(result.rewardAsset).to.equal(order.rewardAsset)
      expect(result.orderAsset).to.equal(order.assetAddress)
      expect(result.costOverpaymentPercent).to.equal(0)
      expect(result.setAmount).to.equal(order.amount)
      expect(ethers.utils.formatEther(result.proposedMaxReward)).to.equal('0.3')
    })
  })

  describe('estimateReceivedAmount', () => {
    it('should return the maxReward minus transaction costs for identical assets on the same chain', async () => {
      const fromAsset = SupportedAssetPriceProvider.ETH
      const toAsset = SupportedAssetPriceProvider.ETH
      const fromChain = 'eth'
      const toChain = 'eth'
      const maxReward = ethers.utils.parseEther('1') // 1 ETH

      // Mock the price fetch and gas estimation
      pricer.receiveAssetPriceWithCache = async () => BigNumber.from(ethers.utils.parseUnits('1', 'ether')) // Simplified 1:1 conversion for simplicity
      pricer.retrieveCostInAsset = async () => ({
        costInWei: ethers.utils.parseUnits('21000', 'wei'), // Mocked gas used
        costInEth: '0.00105', // Mocked cost in Eth (50 gwei gas price)
        costInUsd: 2, // Mocked cost in USD
        costInAsset: ethers.utils.parseUnits('0.01', 'ether'), // 0.01 ETH transaction cost
        asset: fromAsset,
      })

      // Action
      const estimatedReceivedAmount = await pricer.estimateReceivedAmount(
        fromAsset,
        toAsset,
        fromChain,
        'https://ethereum-sepolia-rpc.publicnode.com',
        toChain,
        maxReward,
      )

      // Assert
      expect(ethers.utils.formatEther(estimatedReceivedAmount)).to.equal('0.99')
    })

    it('should correctly estimate the received amount for different assets across chains', async () => {
      // Setup
      const fromAsset = SupportedAssetPriceProvider.ETH // Sending ETH
      const toAsset = SupportedAssetPriceProvider.DOT // Receiving DOT
      const fromChain = 'eth'
      const toChain = 'base'
      const maxReward = ethers.utils.parseEther('1') // 1 ETH

      pricer.receiveAssetPriceWithCache = async () => BigNumber.from(ethers.utils.parseUnits('1', 'ether')) // Simplified 1:1 conversion for simplicity

      pricer.retrieveCostInAsset = async () => ({
        costInWei: ethers.utils.parseUnits('21000', 'wei'), // Mocked gas used
        costInEth: '0.00105', // Mocked cost in Eth (50 gwei gas price)
        costInUsd: 2, // Mocked cost in USD
        costInAsset: ethers.utils.parseUnits('0.01', 'ether'), // 0.01 ETH transaction cost
        asset: fromAsset,
      })

      // Action
      const estimatedReceivedAmount = await pricer.estimateReceivedAmount(
        fromAsset,
        toAsset,
        fromChain,
        'https://ethereum-sepolia-rpc.publicnode.com',
        toChain,
        maxReward,
      )

      // Assert
      const expectedAmount = ethers.utils.parseUnits('0.99', 'ether')
      expect(estimatedReceivedAmount.toString()).to.equal(expectedAmount.toString())
    })

    // describe('conversion tests', function () {
    //   let pricer: Pricer
    //   let mockJsonRpcProvider: any

    //   beforeEach(() => {
    //     mockJsonRpcProvider = {
    //       getGasPrice: sinon.stub().resolves(BigNumber.from('20000000000')), // 20 Gwei
    //     }

    //     pricer = new Pricer(
    //       {
    //         tokens: {
    //           addressZero: '0x0000000000000000000000000000000000000000',
    //           oneOn18Decimals: parseInt('1000000000000000000'),
    //           maxDecimals18: 18,
    //         },
    //         pricer: {
    //           useMultichain: true,
    //           cleanupIntervalSec: 60,
    //           proxyServerUrl: ''
    //         },
    //       },
    //       mockJsonRpcProvider,
    //     )

    //     const fakeProvider = {
    //       getGasPrice: sinon.stub().resolves(BigNumber.from('20000000000')), // Return a fake gas price
    //     }

    //     // mock JsonRpcProvider globally
    //     sinon.stub(ethers.providers, 'JsonRpcProvider').callsFake(() => fakeProvider)
    //     const fetchPriceStub = sinon.stub(pricer, 'fetchPriceAndStoreInCache')

    //     fetchPriceStub.callsFake((assetObj, network) => {
    //       // Dynamic response based on asset
    //       if (assetObj.asset === SupportedAssetPriceProvider.ETH) {
    //         return Promise.resolve('3996')
    //       } else if (assetObj.asset === SupportedAssetPriceProvider.BTC) {
    //         return Promise.resolve('30000')
    //       } else if (assetObj.asset === SupportedAssetPriceProvider.USDC) {
    //         return Promise.resolve('1')
    //       }
    //       // Default response
    //       return Promise.resolve('100')
    //     })
    //   })

    //   afterEach(() => {
    //     sinon.restore()
    //   })

    //   Object.entries(networkToAssetAddressOnPriceProviderMap).forEach(([fromNetwork, fromAssets]) => {
    //     fromAssets.forEach((fromAssetConfig) => {
    //       Object.entries(networkToAssetAddressOnPriceProviderMap).forEach(([toNetwork, toAssets]) => {
    //         toAssets.forEach((toAssetConfig) => {
    //           it(`should estimate received amount from ${fromNetwork} (${fromAssetConfig.asset}) to ${toNetwork} (${toAssetConfig.asset})`, async () => {
    //             const maxRewardWei = ethers.utils.parseEther('1') // 1 ETH as a common max reward for all tests

    //             const fromRpcUrl = 'mockRpcUrlForFromNetwork'

    //             const estimatedAmount = await pricer.estimateReceivedAmount(
    //               fromAssetConfig.asset,
    //               toAssetConfig.asset,
    //               fromNetwork as NetworkNameOnPriceProvider,
    //               fromRpcUrl,
    //               toNetwork as NetworkNameOnPriceProvider,
    //               maxRewardWei,
    //             )

    //             expect(estimatedAmount).to.be.an.instanceOf(BigNumber)
    //           })
    //         })
    //       })
    //     })
    //   })
    // })

    describe('estimateReceivedAmountWithOptions', function () {
      let sandbox: sinon.SinonSandbox

      beforeEach(() => {
        sandbox = sinon.createSandbox()

        sandbox.stub(pricer, 'estimateReceivedAmount').resolves(BigNumber.from('990000000000000000')) // 0.99 ETH
        sandbox.stub(pricer, 'receiveAssetPriceWithCache').resolves(BigNumber.from('2000')) // $2000 per ETH
        sandbox.stub(pricer, 'retrieveCostInAsset').resolves({
          costInWei: BigNumber.from('10000000000000000'), // 0.01 ETH
          costInEth: '0.01',
          costInUsd: 20,
          costInAsset: BigNumber.from('10000000000000000'), // 0.01 ETH
          asset: 'ETH',
        })
      })

      afterEach(() => {
        sandbox.restore()
      })

      it('should accurately estimate received amount with fast modifiers', async function () {
        const estimatedAmount = await pricer.estimateReceivedAmountWithOptions(
          SupportedAssetPriceProvider.ETH,
          SupportedAssetPriceProvider.ETH,
          'arbitrum',
          'http://localhost:8545',
          'optimism',
          ethers.utils.parseEther('1'),
          'high',
          'fast',
          'high',
        )

        const expectedAmount = BigNumber.from('1039500000000000000')
        expect(estimatedAmount.toString()).to.equal(expectedAmount.toString())
      })

      it('should accurately estimate received amount with slow modifiers', async function () {
        const estimatedAmount = await pricer.estimateReceivedAmountWithOptions(
          SupportedAssetPriceProvider.ETH,
          SupportedAssetPriceProvider.ETH,
          'arbitrum',
          'http://localhost:8545',
          'optimism',
          ethers.utils.parseEther('1'),
          'low',
          'slow',
          'zero',
        )

        const expectedAmount = BigNumber.from('990000000000000000')
        expect(estimatedAmount.toString()).to.equal(expectedAmount.toString())
      })

      it('should accurately estimate received amount with custom executor tip percentage', async function () {
        const estimatedAmount = await pricer.estimateReceivedAmountWithOptions(
          SupportedAssetPriceProvider.ETH,
          SupportedAssetPriceProvider.ETH,
          'arbitrum',
          'http://localhost:8545',
          'optimism',
          ethers.utils.parseEther('1'),
          'custom',
          'fast',
          'high',
          10, // Custom executor tip percentage of 10%
          undefined, // No fixed tip value provided
          undefined, // No custom overpay ratio
          undefined, // No custom slippage
        )

        const expectedAmount = BigNumber.from('1039500000000000000')
        expect(estimatedAmount.toString()).to.equal(expectedAmount.toString())
      })

      it('should accurately estimate received amount with custom executor tip value', async function () {
        const customTipValue = ethers.utils.parseEther('0.05') // 0.05 ETH fixed tip value
        const estimatedAmount = await pricer.estimateReceivedAmountWithOptions(
          SupportedAssetPriceProvider.ETH,
          SupportedAssetPriceProvider.ETH,
          'arbitrum',
          'http://localhost:8545',
          'optimism',
          ethers.utils.parseEther('1'),
          'custom',
          'slow',
          'zero',
          undefined, // No percentage tip
          customTipValue, // Custom tip value provided
        )

        const expectedAmount = BigNumber.from('990000000000000000')
        expect(estimatedAmount.toString()).to.equal(expectedAmount.toString())
      })
    })
  })
})
