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
const ethers_1 = require("ethers");
const pricer_service_1 = require("./pricer/pricer.service");
const price_provider_assets_1 = require("./config/price-provider-assets");
const pricerConfig = {
    tokens: {
        addressZero: "0x0000000000000000000000000000000000000000",
        oneOn18Decimals: parseInt("1000000000000000000"),
        maxDecimals18: 18,
    },
    pricer: {
        providerUrl: 'https://rpc.ankr.com/multichain/ae45090060327148428269ea88b3801903f4c81f8a700d8f04dc99a6cb3cb7ac',
        useMultichain: true,
        cleanupIntervalSec: 60,
        useCaching: false
    },
};
const pricer = new pricer_service_1.Pricer(pricerConfig);
function testEstimateReceivedAmount() {
    return __awaiter(this, void 0, void 0, function* () {
        const fromAsset = price_provider_assets_1.SupportedAssetPriceProvider.ETH; // Sending ETH
        const toAsset = price_provider_assets_1.SupportedAssetPriceProvider.USDT;
        const fromChain = 'arbitrum';
        const toChain = 'optimism';
        const maxRewardWei = ethers_1.ethers.utils.parseEther('1'); // 1 ETH
        try {
            const result = yield pricer.estimateReceivedAmount(fromAsset, toAsset, fromChain, "https://arbitrum-sepolia.infura.io/v3/4cb7a3616b654db2b88e09e55c87700b", toChain, maxRewardWei);
            console.log(`Estimated Received Amount: ${result.toString()}`);
        }
        catch (error) {
            console.error(`Error: ${error}`);
        }
    });
}
testEstimateReceivedAmount();
//# sourceMappingURL=testPricer.js.map