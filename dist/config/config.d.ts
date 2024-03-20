interface TokensConfig {
    addressZero: string;
    oneOn18Decimals: number;
    maxDecimals18: number;
}
interface PricerConfig {
    useMultichain: boolean;
    cleanupIntervalSec: number;
    proxyServerUrl: string;
}
interface AppConfig {
    tokens: TokensConfig;
    pricer: PricerConfig;
}
declare const config: () => AppConfig;
declare const _default: AppConfig;
export default _default;
export type Config = ReturnType<typeof config>;
