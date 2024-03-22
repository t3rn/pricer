declare const config: () => {
    tokens: {
        addressZero: string;
        oneOn18Decimals: number;
        maxDecimals18: number;
    };
    pricer: {
        useMultichain: boolean;
        cleanupIntervalSec: number;
        proxyServerUrl: string;
    };
};
declare const _default: {
    tokens: {
        addressZero: string;
        oneOn18Decimals: number;
        maxDecimals18: number;
    };
    pricer: {
        useMultichain: boolean;
        cleanupIntervalSec: number;
        proxyServerUrl: string;
    };
};
export default _default;
export type Config = ReturnType<typeof config>;
