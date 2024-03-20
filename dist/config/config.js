"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const env_var_1 = __importDefault(require("env-var"));
dotenv.config();
const get = env_var_1.default.get;
const config = () => ({
    tokens: {
        addressZero: get('ADDRESS_ZERO').required().default('0x0000000000000000000000000000000000000000').asString(),
        oneOn18Decimals: get('ONE_ON_18_DECIMALS').required().default(1000000000000000000).asIntPositive(),
        maxDecimals18: get('MAX_DECIMALS_18').required().default(18).asIntPositive(),
    },
    pricer: {
        useMultichain: get('PRICER_USE_MULTICHAIN').required().default('false').asBoolStrict(),
        cleanupIntervalSec: get('PRICER_CLEANUP_INTERVAL_SEC').required().default(60).asInt(),
        proxyServerUrl: get('PRICER_PROXY_SERVER_URL')
            .required()
            .default(process.env.NODE_ENV === 'production' ? 'https://t0rn-explorer.fly.dev/v1' : 'http://127.0.0.1:8080/v1')
            .asString(),
    },
});
exports.default = config();
//# sourceMappingURL=config.js.map