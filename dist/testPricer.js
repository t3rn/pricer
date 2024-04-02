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
const index_1 = require("./index");
const pricerConfig = {
    tokens: {
        addressZero: '0x0000000000000000000000000000000000000000',
        oneOn18Decimals: parseInt('1000000000000000000'),
        maxDecimals18: 18,
    },
    pricer: {
        useMultichain: true,
        cleanupIntervalSec: 60,
        proxyServerUrl: 'http://127.0.0.1:8080/v1',
    },
};
let pricer;
pricer = new index_1.Pricer(pricerConfig);
function testEstimateReceivedAmount() {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        const balance = ethers_1.BigNumber.from('33045466209227917923');
        const costOnTarget = {
            costInWei: ethers_1.BigNumber.from('2310000000000'),
            costInEth: '0.000002310000000000',
            costInUsd: 0.008247841374098439,
            costInAsset: ethers_1.BigNumber.from('2310000000000'),
            asset: 'eth',
        };
        // const strategy = {
        //     minProfitPerOrder: BigNumber.from('1'),
        //     minProfitRate: 0.00001,
        //     maxAmountPerOrder: BigNumber.from('1000'),
        //     minAmountPerOrder: BigNumber.from('5'),
        //     maxShareOfMyBalancePerOrder: 25
        // }
        const strategy = {
            minProfitPerOrder: ethers_1.BigNumber.from((0.1 * pricerConfig.tokens.oneOn18Decimals * 0.001).toString()),
            minProfitRate: 0.0000001,
            maxAmountPerOrder: ethers_1.BigNumber.from((10 * pricerConfig.tokens.oneOn18Decimals).toString()),
            minAmountPerOrder: ethers_1.BigNumber.from((0.0001 * pricerConfig.tokens.oneOn18Decimals).toString()),
            maxShareOfMyBalancePerOrder: 25,
        };
        const order = {
            id: '0x632321fdcb94be95eb6963b14eca0bb341e29ce3b6650cf225734f043851386b',
            asset: 0,
            assetAddress: '0x0000000000000000000000000000000000000000',
            assetNative: true,
            targetAccount: '0xc447247a786f6ff2e2e6e55d31214bafe2c630b4',
            amount: ethers_1.BigNumber.from('500000000000000'),
            rewardAsset: '0x0000000000000000000000000000000000000000',
            insurance: ethers_1.BigNumber.from('0'),
            maxReward: ethers_1.BigNumber.from('650000000000000'),
            nonce: 5578451,
            destination: 'opsp',
            source: 'arbt',
            txHash: '0x6596f4f3e12e36337a43d77bf9992a7f591ce22fa609c1785161fc3e797dae27',
        };
        const pricing = {
            assetA: 'eth',
            assetB: 'eth',
            priceAinB: ethers_1.BigNumber.from('1000000000000000000'),
            priceAInUsd: '3570.494101341316',
            priceBInUsd: '3570.494101341316',
        };
        try {
            const orderProfitability = pricer.evaluateDeal(balance, costOnTarget, strategy, order, pricing);
            const endTime = new Date().getTime();
            const elapsedTime = (endTime - startTime) / 1000; // Calculate elapsed time in seconds
            console.log(`Function execution time: ${elapsedTime} seconds`);
            console.log({
                isProfitable: orderProfitability.isProfitable,
                profit: orderProfitability.profit.toString(),
                loss: orderProfitability.loss.toString(),
            });
            // console.log(`Estimated Received Amount: ${result.toString()}`)
        }
        catch (error) {
            console.error(`Error: ${error}`);
        }
    });
}
testEstimateReceivedAmount();
//# sourceMappingURL=testPricer.js.map