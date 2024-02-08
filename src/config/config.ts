import * as dotenv from 'dotenv'
import envVar from 'env-var'
import { LogLevel } from './types'

dotenv.config();

const get = envVar.get

const config = () => ({
    tokens: {
        addressZero: get('ADDRESS_ZERO').required().default('0x0000000000000000000000000000000000000000').asString(),
        oneOn18Decimals: get('ONE_ON_18_DECIMALS').required().default(1000000000000000000).asIntPositive(),
        maxDecimals18: get('MAX_DECIMALS_18').required().default(18).asIntPositive(),
    },
    pricer: {
        providerUrl: get('PRICER_PROVIDER_URL').required().asString(),
        useMultichain: get('PRICER_USE_MULTICHAIN').required().default('false').asBoolStrict(),
        cleanupIntervalSec: get('PRICER_CLEANUP_INTERVAL_SEC').required().default(60).asInt(),
    }
})

export default config()
export type Config = ReturnType<typeof config>