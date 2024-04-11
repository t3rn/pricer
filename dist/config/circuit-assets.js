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
exports.AssetMapper = exports.mapSymbolToCurrency = exports.assetNameCircuitToPriceProvider = exports.networkNameCircuitToPriceProvider = exports.SupportedAssetCircuit = void 0;
const price_provider_assets_1 = require("./price-provider-assets");
const logger_1 = require("../utils/logger");
const ethers_1 = require("ethers");
var SupportedAssetCircuit;
(function (SupportedAssetCircuit) {
    SupportedAssetCircuit[SupportedAssetCircuit["ETH"] = 0] = "ETH";
    SupportedAssetCircuit[SupportedAssetCircuit["BTC"] = 1] = "BTC";
    SupportedAssetCircuit[SupportedAssetCircuit["BNB"] = 2] = "BNB";
    SupportedAssetCircuit[SupportedAssetCircuit["SOL"] = 3] = "SOL";
    SupportedAssetCircuit[SupportedAssetCircuit["DOT"] = 100] = "DOT";
    SupportedAssetCircuit[SupportedAssetCircuit["USDC"] = 101] = "USDC";
    SupportedAssetCircuit[SupportedAssetCircuit["USDT"] = 102] = "USDT";
    SupportedAssetCircuit[SupportedAssetCircuit["DAI"] = 103] = "DAI";
    SupportedAssetCircuit[SupportedAssetCircuit["FIL"] = 199] = "FIL";
    SupportedAssetCircuit[SupportedAssetCircuit["T3USD"] = 104] = "T3USD";
    SupportedAssetCircuit[SupportedAssetCircuit["TRN"] = 3333] = "TRN";
    SupportedAssetCircuit[SupportedAssetCircuit["BRN"] = 3343] = "BRN";
})(SupportedAssetCircuit || (exports.SupportedAssetCircuit = SupportedAssetCircuit = {}));
exports.networkNameCircuitToPriceProvider = {
    ethm: 'eth',
    base: 'base',
    arbm: 'arbitrum',
    bscm: 'bsc',
    opti: 'optimism',
    linm: 'linea',
    bsct: 'bsc',
    opsp: 'optimism',
    bsgr: 'base',
    bscp: 'base',
    bssp: 'base',
    scrt: 'scroll',
    arbt: 'arbitrum',
    sepl: 'eth',
    poly: 'polygon',
    t0rn: 'polygon',
    l0rn: 'arbitrum',
    l1rn: 'arbitrum',
    l3rn: 'arbitrum',
    line: 'linea',
    blss: 'blast',
    blst: 'blast',
};
exports.assetNameCircuitToPriceProvider = {
    0: price_provider_assets_1.SupportedAssetPriceProvider.ETH,
    1: price_provider_assets_1.SupportedAssetPriceProvider.BTC,
    2: price_provider_assets_1.SupportedAssetPriceProvider.BNB,
    3: price_provider_assets_1.SupportedAssetPriceProvider.SOL,
    100: price_provider_assets_1.SupportedAssetPriceProvider.DOT,
    101: price_provider_assets_1.SupportedAssetPriceProvider.USDC,
    102: price_provider_assets_1.SupportedAssetPriceProvider.USDT,
    103: price_provider_assets_1.SupportedAssetPriceProvider.DAI,
    199: price_provider_assets_1.SupportedAssetPriceProvider.FIL,
    104: price_provider_assets_1.SupportedAssetPriceProvider.T3USD,
    3333: price_provider_assets_1.SupportedAssetPriceProvider.TRN,
    3343: price_provider_assets_1.SupportedAssetPriceProvider.BRN,
};
function mapSymbolToCurrency(asset) {
    const priceProvider = exports.assetNameCircuitToPriceProvider[asset];
    return price_provider_assets_1.SupportedAssetPriceProvider[priceProvider.toUpperCase()].toUpperCase();
}
exports.mapSymbolToCurrency = mapSymbolToCurrency;
class AssetMapper {
    constructor(_config) {
        this.config = _config;
    }
    static getInstance(_config) {
        if (!this.instance) {
            this.instance = new AssetMapper(_config);
        }
        return this.instance;
    }
    getSupportedAssetsForNetwork(networkId) {
        const networkName = exports.networkNameCircuitToPriceProvider[networkId];
        const assetsAndAddresses = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[networkName];
        if (!assetsAndAddresses) {
            logger_1.logger.warn(`No assets configured for network: ${networkName}`);
            return [];
        }
        return assetsAndAddresses.map((assetAndAddress) => assetAndAddress.asset);
    }
    static getAssetId(asset) {
        for (const [assetIdString, _asset] of Object.entries(exports.assetNameCircuitToPriceProvider)) {
            if (_asset === asset) {
                return parseInt(assetIdString);
            }
        }
        return 0;
    }
    static fakePriceOfAsset(amount, asset) {
        switch (asset) {
            case price_provider_assets_1.SupportedAssetPriceProvider.TRN:
                return amount * 2;
            case price_provider_assets_1.SupportedAssetPriceProvider.BRN:
                return amount / 10;
            case price_provider_assets_1.SupportedAssetPriceProvider.BTC:
                return amount * 40000;
            case price_provider_assets_1.SupportedAssetPriceProvider.ETH:
                return amount * 2000;
            case price_provider_assets_1.SupportedAssetPriceProvider.BNB:
                return amount * 400;
            case price_provider_assets_1.SupportedAssetPriceProvider.SOL:
                return amount * 100;
            case price_provider_assets_1.SupportedAssetPriceProvider.DOT:
                return amount * 6;
            case price_provider_assets_1.SupportedAssetPriceProvider.USDC:
                return amount;
            case price_provider_assets_1.SupportedAssetPriceProvider.USDT:
                return amount;
            case price_provider_assets_1.SupportedAssetPriceProvider.DAI:
                return amount;
            case price_provider_assets_1.SupportedAssetPriceProvider.FIL:
                return amount * 4;
            case price_provider_assets_1.SupportedAssetPriceProvider.T3USD:
                return amount;
            default:
                return 0;
        }
    }
    static fakePriceOfVendorAsset(amount, assetA, assetB) {
        const assetNameA = exports.assetNameCircuitToPriceProvider[assetA];
        const assetNameB = exports.assetNameCircuitToPriceProvider[assetB];
        if (!assetNameA || !assetNameB) {
            throw new Error(`Asset ${assetA} or ${assetB} not found`);
        }
        const assetPriceA = AssetMapper.fakePriceOfAsset(amount, assetNameA);
        const assetPriceB = AssetMapper.fakePriceOfAsset(amount, assetNameB);
        return (assetPriceA / assetPriceB) * amount;
    }
    checkAssetBalance(walletAddress, asset, networkId, assetContract) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetName = exports.assetNameCircuitToPriceProvider[asset];
            const defaultAddress = ethers_1.ethers.constants.AddressZero;
            if (!assetName) {
                logger_1.logger.error({
                    asset,
                    sourceNetwork: networkId,
                    defaultAddress,
                }, `🍑🚨 Asset not found in config. Return zero as balance`);
                return ethers_1.BigNumber.from(0);
            }
            try {
                const assetAddress = this.getAddressOnTarget4BByCircuitAssetNumber(networkId, asset);
                if (assetAddress === defaultAddress) {
                    logger_1.logger.warn({
                        asset,
                        assetName,
                        sourceNetwork: networkId,
                    }, `🍑 Asset not found on network. Return zero as balance`);
                    return ethers_1.BigNumber.from(0);
                }
                return (yield assetContract.balanceOf(walletAddress));
            }
            catch (e) {
                logger_1.logger.error({
                    asset,
                    sourceNetwork: networkId,
                    defaultAddress,
                }, `🍑🚨 Asset address not found in config. Return zero as balance`);
                return ethers_1.BigNumber.from(0);
            }
        });
    }
    mapAssetByAddress(targetNetworkId, assetAddress) {
        var _a;
        const networkName = exports.networkNameCircuitToPriceProvider[targetNetworkId];
        const assetsForNetwork = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[networkName];
        if (!Array.isArray(assetsForNetwork)) {
            const errorMessage = '🍑🚨 Network name on Circuit not mapped to price provider.';
            logger_1.logger.error({
                assetAddress,
                target: targetNetworkId,
                network: networkName,
            }, errorMessage);
            throw new Error(errorMessage);
        }
        const assetName = (_a = assetsForNetwork.find((assetAndAddress) => {
            return assetAndAddress.address.toLowerCase() === assetAddress.toLowerCase();
        })) === null || _a === void 0 ? void 0 : _a.asset;
        if (assetName) {
            return assetName;
        }
        else {
            const errorMessage = 'Asset address does not match any addresses in the provided mapping.';
            logger_1.logger.error({
                assetAddress,
                target: targetNetworkId,
                network: networkName,
            }, `🍑🚨 ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }
    getAddressOnTarget4BByCircuitAssetNumber(targetNetworkId, asset) {
        const networkName = exports.networkNameCircuitToPriceProvider[targetNetworkId];
        const assetName = exports.assetNameCircuitToPriceProvider[asset];
        if (!assetName) {
            const errorMessage = 'Asset not mapped to a known asset name.';
            logger_1.logger.error({
                asset,
                targetNetworkId,
            }, `🍑🚨 ${errorMessage}`);
            throw new Error(errorMessage);
        }
        if (!Array.isArray(price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[networkName])) {
            const errorMessage = '🍑🚨 NetworkToAssetAddressOnPriceProviderMap is not an array.';
            logger_1.logger.error({ targetNetworkId, networkName }, errorMessage);
            throw new Error(errorMessage);
        }
        const assetAddressMapping = price_provider_assets_1.networkToAssetAddressOnPriceProviderMap[networkName].find((assetAndAddress) => assetAndAddress.asset === assetName);
        if (assetAddressMapping && assetAddressMapping.address) {
            return assetAddressMapping.address;
        }
        else {
            const errorMessage = '🍑🚨 Address not found in NetworkToAssetAddressOnPriceProviderMap mapping.';
            logger_1.logger.error({ asset, assetName, targetNetworkId, networkName }, errorMessage);
            throw new Error(errorMessage);
        }
    }
}
exports.AssetMapper = AssetMapper;
//# sourceMappingURL=circuit-assets.js.map