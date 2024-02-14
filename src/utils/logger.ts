import pino from 'pino'
import * as dotenv from 'dotenv'

dotenv.config()

const isPrettyPrintEnabled = process.env.LOG_PRETTY === 'true'
const isTestEnvironment = process.env.NODE_ENV === 'test'

const loggerConfig = {
  // Disable logging in the 'test' environment
  enabled: !isTestEnvironment,
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
  base: undefined,
  stream: process.stdout,
  transport: isPrettyPrintEnabled
    ? {
        target: 'pino-pretty',
      }
    : undefined,
}

export const logger = pino(loggerConfig)
export type Logger = pino.Logger
