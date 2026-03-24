import process from 'node:process'

import { Client } from '@proj-airi/server-sdk'
import { MessageHeartbeat } from '@proj-airi/server-shared/types'

import { createOpenClawAdapter } from './openclaw-adapter.js'

function boolFromEnv(raw, fallback) {
  if (typeof raw === 'undefined')
    return fallback

  const normalized = String(raw).toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes')
    return true
  if (normalized === '0' || normalized === 'false' || normalized === 'no')
    return false

  return fallback
}

function numFromEnv(raw, fallback) {
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0)
    return n
  return fallback
}

const config = {
  wsUrl: process.env.OPENCLAW_AIRI_WS_URL || 'ws://127.0.0.1:6121/ws',
  token: process.env.OPENCLAW_AIRI_TOKEN,
  openclawBaseUrl: process.env.OPENCLAW_BASE_URL || 'http://127.0.0.1:8123',
  openclawInvokePath: process.env.OPENCLAW_INVOKE_PATH || '/v1/airi/invoke',
  apiKey: process.env.OPENCLAW_API_KEY,
  enableMemory: boolFromEnv(process.env.OPENCLAW_ENABLE_MEMORY, true),
  enableAgent: boolFromEnv(process.env.OPENCLAW_ENABLE_AGENT, true),
  contextTopK: numFromEnv(process.env.OPENCLAW_CONTEXT_TOP_K, 8),
}

const airiClient = new Client({
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
    'module:authenticate',
  ],
  onError: (error) => {
    console.error('[openclaw-bridge] ws error:', error)
  },
})

const adapter = createOpenClawAdapter({
  client: airiClient,
  config,
})

adapter.initialize()

airiClient.connect().then(() => {
  console.info('[openclaw-bridge] connected to MiRa ws')
}).catch((error) => {
  console.error('[openclaw-bridge] failed to connect:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('[openclaw-bridge] unhandledRejection:', error)
})

process.on('SIGINT', () => {
  airiClient.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  airiClient.close()
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
