import { NetworkNameOnCircuit } from './circuit-assets';
export declare enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export interface ContractsAddresses {
    attesters: string;
    escrowGMP: string;
    remoteOrder: string;
    localExchange: string;
    attestersPortal: string;
    orderBook: string;
    attestationBook: string;
    singleAttestationBook: string;
    attestationBatchMaker: string;
}
export interface NetworkConfig {
    contracts: ContractsAddresses;
    id: NetworkNameOnCircuit;
    name: string;
    tokens: {
        t3BTC: string;
        t3DOT: string;
        t3SOL: string;
        t3USD: string;
        TRN: string;
    };
    rpc: {
        ws: string[];
        http: string[];
    };
    attestationWaitTimeSec: number;
    blockTimeSec: number;
}
export interface NetworkConfigWithPrivKey extends NetworkConfig {
    privateKey: string;
}
