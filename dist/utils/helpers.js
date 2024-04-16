"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSymbolToCurrency = void 0;
const price_provider_assets_1 = require("../config/price-provider-assets");
const circuit_assets_1 = require("../config/circuit-assets");
function mapSymbolToCurrency(asset) {
    const priceProvider = circuit_assets_1.assetNameCircuitToPriceProvider[asset];
    return price_provider_assets_1.SupportedAssetPriceProvider[priceProvider.toUpperCase()].toUpperCase();
}
exports.mapSymbolToCurrency = mapSymbolToCurrency;
//# sourceMappingURL=helpers.js.map