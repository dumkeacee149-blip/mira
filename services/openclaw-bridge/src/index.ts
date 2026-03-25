import process from 'node:process'

import { Client } from '@proj-mira/server-sdk'
import { MessageHeartbeat } from '@proj-mira/server-shared/types'

import { createOpenClawAdapter } from './adapter'

interface RawEnv {
  OPENCLAW_MIRA_WS_URL?: string
  OPENCLAW_MIRA_TOKEN?: string
  OPENCLAW_BASE_URL?: string
  OPENCLAW_INVOKE_PATH?: string
  OPENCLAW_API_KEY?: string
  OPENCLAW_ENABLE_MEMORY?: string
  OPENCLAW_ENABLE_AGENT?: string
  OPENCLAW_CONTEXT_TOP_K?: string
}

function envBool(raw: string | undefined, fallback: boolean): boolean {
  if (typeof raw === 'undefined')
    return fallback

  const normalized = raw.toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes')
    return true

  if (normalized === '0' || normalized === 'false' || normalized === 'no')
    return false

  return fallback
}

function envNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0)
    return n
  return fallback
}

const env = process.env as RawEnv
const config = {
  wsUrl: env.OPENCLAW_MIRA_WS_URL || 'ws://localhost:6121/ws',
  token: env.OPENCLAW_MIRA_TOKEN,
  openclawBaseUrl: env.OPENCLAW_BASE_URL || 'http://localhost:8000',
  openclawInvokePath: env.OPENCLAW_INVOKE_PATH || '/v1/mira/invoke',
  apiKey: env.OPENCLAW_API_KEY,
  enableMemory: envBool(env.OPENCLAW_ENABLE_MEMORY, true),
  enableAgent: envBool(env.OPENCLAW_ENABLE_AGENT, true),
  contextTopK: envNumber(env.OPENCLAW_CONTEXT_TOP_K, 8),
}

const miraClient = new Client({
  name: 'openclaw-bridge',
  url: config.wsUrl,
  token: config.token,
  heartbeat: {
    readTimeout: 30_000,
    message: MessageHeartbeat.Ping,
  },
  possibleEvents: [
    'input:text',
    'spark:notify',
    'spark:command',
    'spark:emit',
    'context:update',
    'output:gen-ai:chat:message',
    'output:gen-ai:chat:complete',
    'module:authenticate',
  ],
  onError: (error) => {
    console.error('[openclaw-bridge] ws error:', error)
  },
})

const adapter = createOpenClawAdapter({
  client: miraClient,
  config,
})

adapter.initialize()

miraClient.connect().then(() => {
  console.info('[openclaw-bridge] connected to MIRA ws')
}).catch((error) => {
  console.error('[openclaw-bridge] failed to connect:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('[openclaw-bridge] unhandledRejection:', error)
})

process.on('SIGINT', () => {
  miraClient.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  miraClient.close()
  process.exit(0)
})

console.info('[openclaw-bridge] starting with config:', {
  wsUrl: config.wsUrl,
  openclawBaseUrl: config.openclawBaseUrl,
  openclawInvokePath: config.openclawInvokePath,
  enableMemory: config.enableMemory,
  enableAgent: config.enableAgent,
  contextTopK: config.contextTopK,
})
