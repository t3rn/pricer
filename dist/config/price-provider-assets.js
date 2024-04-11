"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkToAssetAddressOnPriceProviderMap = exports.mapT3rnVendorAssetsToSupportedAssetPrice = exports.mapSupportedAssetPriceProviderToT3rnVendorAssets = exports.t3rnVendorAsset = exports.SupportedAssetPriceProvider = void 0;
const ethers_1 = require("ethers");
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
    SupportedAssetPriceProvider["TRN"] = "trn";
    SupportedAssetPriceProvider["BRN"] = "brn";
    SupportedAssetPriceProvider["DOT"] = "dot";
    SupportedAssetPriceProvider["UNKNOWN"] = "unknown";
})(SupportedAssetPriceProvider || (exports.SupportedAssetPriceProvider = SupportedAssetPriceProvider = {}));
var t3rnVendorAsset;
(function (t3rnVendorAsset) {
    t3rnVendorAsset["BTC"] = "t3BTC";
    t3rnVendorAsset["SOL"] = "t3SOL";
    t3rnVendorAsset["DOT"] = "t3DOT";
    t3rnVendorAsset["USD"] = "t3USD";
    t3rnVendorAsset["TRN"] = "TRN";
    t3rnVendorAsset["BRN"] = "BRN";
})(t3rnVendorAsset || (exports.t3rnVendorAsset = t3rnVendorAsset = {}));
const mapSupportedAssetPriceProviderToT3rnVendorAssets = (assetName) => {
    switch (assetName) {
        case SupportedAssetPriceProvider.BTC:
            return t3rnVendorAsset.BTC;
        case SupportedAssetPriceProvider.SOL:
            return t3rnVendorAsset.SOL;
        case SupportedAssetPriceProvider.DOT:
            return t3rnVendorAsset.DOT;
        case SupportedAssetPriceProvider.T3USD:
            return t3rnVendorAsset.USD;
        case SupportedAssetPriceProvider.TRN:
            return t3rnVendorAsset.TRN;
        case SupportedAssetPriceProvider.BRN:
            return t3rnVendorAsset.BRN;
        default:
            throw new Error(`Asset ${assetName} not supported`);
    }
};
exports.mapSupportedAssetPriceProviderToT3rnVendorAssets = mapSupportedAssetPriceProviderToT3rnVendorAssets;
const mapT3rnVendorAssetsToSupportedAssetPrice = (tokenName) => {
    switch (tokenName.toLowerCase()) {
        case t3rnVendorAsset.BTC.toLowerCase():
            return SupportedAssetPriceProvider.BTC;
        case t3rnVendorAsset.DOT.toLowerCase():
            return SupportedAssetPriceProvider.DOT;
        case t3rnVendorAsset.SOL.toLowerCase():
            return SupportedAssetPriceProvider.SOL;
        case t3rnVendorAsset.USD.toLowerCase():
        case t3rnVendorAsset.TRN.toLowerCase():
        case t3rnVendorAsset.BRN.toLowerCase():
            return SupportedAssetPriceProvider.USDT;
        default:
            throw new Error(`Asset ${tokenName} not supported`);
    }
};
exports.mapT3rnVendorAssetsToSupportedAssetPrice = mapT3rnVendorAssetsToSupportedAssetPrice;
const defaultNetworkData = {
    eth: [
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
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
        {
            asset: 'dot',
            address: '0xe56AC558178c4a71AEa3E542Ff4bDD131B5fCE54',
        },
    ],
    blast: [
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
    ],
    base: [
        {
            asset: 'base',
            address: '0x4200000000000000000000000000000000000006',
        },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        {
            asset: 'usdc',
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        },
        {
            asset: 'usdt',
            address: '0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9',
        },
        {
            asset: 'dai',
            address: '0x591e79239a7d679378eC8c847e5038150364C78F',
        },
        {
            asset: 'dot',
            address: '0xb85BCF4d3A2eE1DA17F684F9f890Cd5807Bbe5A3',
        },
    ],
    scroll: [
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        {
            asset: 'usdc',
            address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
        },
        {
            asset: 'usdt',
            address: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
        },
        {
            asset: 'dot',
            address: '0x39c36E69BC4fA97a7380de21d6EF88377F7822ad',
        },
    ],
    arbitrum: [
        {
            asset: 'arbitrum',
            address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
        },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        {
            asset: 'usdc',
            address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        },
        {
            asset: 'usdt',
            address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        },
        {
            asset: 'dot',
            address: '0x4909C938CD2ce2A31adDbee9b469694549D8d0e1',
        },
    ],
    bsc: [
        {
            // asset: 'bnb',
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        // {
        //   asset: 'eth',
        //   address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
        // },
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
        // TODO: this is wrapped DOT
        // check this out: https://support.polkadot.network/support/solutions/articles/65000169207-what-is-the-contract-address-of-polkadot-
        {
            asset: 'dot',
            address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
        },
    ],
    polygon: [
        {
            asset: 'matic',
            address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
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
        // TODO: this is wrapped ETH
        // {
        //   asset: 'eth',
        //   address: '0x4200000000000000000000000000000000000006',
        // },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
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
        {
            asset: 'dot',
            address: '0xd36ba3dfd846eFF512Ac3712a92500Ae665689b2',
        },
    ],
    file: [
        {
            asset: 'optimism',
            address: '0x4200000000000000000000000000000000000042',
        },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
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
        {
            asset: 'dot',
            address: '0x31c7baa3025FbF3b177f26b6Cd2bF972Cfa5893F',
        },
    ],
    avalanche_fuji: [],
    avalanche: [],
    fantom: [],
    syscoin: [],
    flare: [],
    gnosis: [],
    linea: [
        // TODO: this is wrapped ETH
        // {
        //   asset: 'eth',
        //   address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
        // },
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        {
            asset: 'usdt',
            address: '0x1990bc6dfe2ef605bfc08f5a23564db75642ad73',
        },
        {
            asset: 'dot',
            address: '0x4b227b3c6AE905D97CdfB765afe8b23D5154b81c',
        },
    ],
    polygon_mumbai: [],
    polygon_zkevm: [],
    rollux: [],
    eth_goerli: [],
    optimism_testnet: [],
    t0rn: [
        {
            asset: 'dot',
            address: '0x9D0685F859782B4bC3f0E4403bEeF11eDA8AC2E8',
        },
    ],
    t2rn: [],
    l0rn: [
        {
            asset: 'eth',
            address: ethers_1.ethers.constants.AddressZero,
        },
        {
            asset: 'dot',
            address: '0x4b227b3c6AE905D97CdfB765afe8b23D5154b81c',
        },
    ],
    filecoin: [],
};
// @ts-ignore
exports.networkToAssetAddressOnPriceProviderMap = defaultNetworkData;
//# sourceMappingURL=price-provider-assets.js.map