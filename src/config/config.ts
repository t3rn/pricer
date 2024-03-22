import * as dotenv from 'dotenv'
import envVar from 'env-var'
import { NetworkConfig } from './types'

dotenv.config()

const get = envVar.get

interface TokensConfig {
  addressZero: string
  addressNonZero?: string
  bytes32Zero?: string
  oneOn18Decimals: number
  maxPrecision?: number
  maxDecimals18: number
  commitGmpByte?: string
  revertGmpByte?: string
  supportTokens?: boolean
}

interface PricerConfig {
  useMultichain: boolean
  cleanupIntervalSec: number
  proxyServerUrl: string
}

interface AppConfig {
  tokens: TokensConfig
  pricer: PricerConfig
  networks?: Record<string, NetworkConfig & { privateKey: string | undefined }>
}

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
})

export default config()
export type Config = ReturnType<typeof config>
