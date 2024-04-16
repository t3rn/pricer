"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetNameCircuitToPriceProvider = exports.networkNameCircuitToPriceProvider = exports.SupportedAssetCircuit = void 0;
const price_provider_assets_1 = require("./price-provider-assets");
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
// IMPORTANT
// ANKR only supports these chains:
// arbitrum, avalanche, base, bsc, eth, fantom, flare, gnosis, linea, optimism, polygon, polygon_zkevm, rollux, scroll, syscoin, avalanche_fuji, polygon_mumbai
// pass any other chain than one of these and you will get error 'invalid argument 0: invalid params'
// so try to convert incoming chains to existing ones, example: l0rn: 'arbitrum'
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
    blss: 'base',
    blst: 'base',
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
//# sourceMappingURL=circuit-assets.js.map