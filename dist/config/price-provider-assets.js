"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkToAssetAddressOnPriceProviderMap = exports.SupportedAssetPriceProvider = void 0;
var SupportedAssetPriceProvider;
(function (SupportedAssetPriceProvider) {
    SupportedAssetPriceProvider["ETH"] = "eth";
    SupportedAssetPriceProvider["BTC"] = "btc";
    SupportedAssetPriceProvider["SOL"] = "sol";
    SupportedAssetPriceProvider["FIL"] = "filecoin";
    SupportedAssetPriceProvider["DAI"] = "dai";
    SupportedAssetPriceProvider["USDC"] = "usdc";
    SupportedAssetPriceProvider["USDT"] = "usdt";
    SupportedAssetPriceProvider["T3USD"] = "usdt";
    SupportedAssetPriceProvider["MATIC"] = "matic";
    SupportedAssetPriceProvider["OPTIMISM"] = "optimism";
    SupportedAssetPriceProvider["BASE"] = "base";
    SupportedAssetPriceProvider["SCROLL"] = "scroll";
    SupportedAssetPriceProvider["ARBITRUM"] = "arbitrum";
    SupportedAssetPriceProvider["BSC"] = "bsc";
    SupportedAssetPriceProvider["BNB"] = "bsc";
    SupportedAssetPriceProvider["TRN"] = "t3rn";
    SupportedAssetPriceProvider["BRN"] = "t1rn";
    SupportedAssetPriceProvider["DOT"] = "dot";
    SupportedAssetPriceProvider["UNKNOWN"] = "unknown";
})(SupportedAssetPriceProvider || (exports.SupportedAssetPriceProvider = SupportedAssetPriceProvider = {}));
const defaultNetworkData = {
    eth: [
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'usdc',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        },
        {
            asset: 'usdt',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        },
        {
            asset: 'matic',
            address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
        },
        {
            asset: 'arbitrum',
            address: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
        },
        {
            asset: 'optimism',
            address: '0x4200000000000000000000000000000000000042',
        },
    ],
    base: [
        {
            asset: 'base',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'eth',
            address: '0x4200000000000000000000000000000000000006',
        },
        {
            asset: 'usdc',
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        },
    ],
    scroll: [
        {
            asset: 'scroll',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'eth',
            address: '0x5300000000000000000000000000000000000004',
        },
        {
            asset: 'usdc',
            address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
        },
        {
            asset: 'usdt',
            address: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
        },
    ],
    arbitrum: [
        {
            asset: 'arbitrum',
            address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
        },
        {
            asset: 'eth',
            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        },
        {
            asset: 'usdc',
            address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        },
        {
            asset: 'usdt',
            address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        },
    ],
    bsc: [
        {
            asset: 'bsc',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'eth',
            address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
        },
        {
            asset: 'usdc',
            address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        },
        {
            asset: 'usdt',
            address: '0x55d398326f99059ff775485246999027b3197955',
        },
        {
            asset: 'arbitrum',
            address: '0xa050ffb3eeb8200eeb7f61ce34ff644420fd3522',
        },
        {
            asset: 'optimism',
            address: '0x170c84e3b1d282f9628229836086716141995200',
        },
        {
            asset: 'matic',
            address: '0xcc42724c6683b7e57334c4e856f4c9965ed682bd',
        },
    ],
    polygon: [
        {
            asset: 'matic',
            address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        },
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'usdc',
            address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
        },
        {
            asset: 'usdt',
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        },
    ],
    optimism: [
        {
            asset: 'optimism',
            address: '0x4200000000000000000000000000000000000042',
        },
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'usdc',
            address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        },
        {
            asset: 'usdt',
            address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        },
        {
            asset: 'matic',
            address: '0xe211233fe8b6964208cfc7ca66df9c0340088670',
        },
    ],
    file: [
        {
            asset: 'optimism',
            address: '0x4200000000000000000000000000000000000042',
        },
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'usdc',
            address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        },
        {
            asset: 'usdt',
            address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        },
        {
            asset: 'matic',
            address: '0xe211233fe8b6964208cfc7ca66df9c0340088670',
        },
    ],
    avalanche_fuji: [],
    avalanche: [],
    fantom: [],
    syscoin: [],
    flare: [],
    gnosis: [],
    linea: [
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
        {
            asset: 'usdt',
            address: '0x1990bc6dfe2ef605bfc08f5a23564db75642ad73',
        },
    ],
    polygon_mumbai: [],
    polygon_zkevm: [],
    rollux: [],
    eth_goerli: [],
    optimism_testnet: [],
    t0rn: [],
    t2rn: [],
    l0rn: [
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
    ],
    l1rn: [
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
    ],
    l3rn: [
        {
            asset: 'eth',
            address: '0x0000000000000000000000000000000000000000',
        },
    ],
    filecoin: [],
};
// @ts-ignore
exports.networkToAssetAddressOnPriceProviderMap = defaultNetworkData;
//# sourceMappingURL=price-provider-assets.js.map