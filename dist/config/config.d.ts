declare const config: () => {
    tokens: {
        addressZero: string;
        oneOn18Decimals: number;
        maxDecimals18: number;
    };
    pricer: {
        providerUrl: string;
        useMultichain: boolean;
        cleanupIntervalSec: number;
    };
};
declare const _default: {
    tokens: {
        addressZero: string;
        oneOn18Decimals: number;
        maxDecimals18: number;
    };
    pricer: {
        providerUrl: string;
        useMultichain: boolean;
        cleanupIntervalSec: number;
    };
};
export default _default;
export type Config = ReturnType<typeof config>;
