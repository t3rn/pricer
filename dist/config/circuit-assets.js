"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetMapper = exports.networkNameCircuitToPriceProvider = void 0;
const price_provider_assets_1 = require("./price-provider-assets");
exports.networkNameCircuitToPriceProvider = {
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
    l0rn: 'polygon',
};
class AssetMapper {
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
}
exports.AssetMapper = AssetMapper;
//# sourceMappingURL=circuit-assets.js.map