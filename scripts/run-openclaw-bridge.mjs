#!/usr/bin/env node
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const bridgeDir = `${__dirname.replace('/airi', '')}/airi/services/openclaw-bridge`

const command = process.env.NODE
  ? process.env.NODE
  : '/Users/dalao/.openclaw/tools/node-v22.22.0/bin/node'

const args = [
  '/Users/dalao/.openclaw/workspace/airi/node_modules/.bin/tsx',
  '--env-file', `${bridgeDir}/.env`,
  '--env-file-if-exists', `${bridgeDir}/.env.local`,
  `${bridgeDir}/src/index.ts`,
]

const child = spawn(command, args, {
  cwd: bridgeDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    AIRI_RUNTIME_MODE: 'embedded',
  },
})

if (child.pid)
  console.log(`[openclaw-bridge-bootstrap] started pid=${child.pid}`)

child.on('exit', (code, signal) => {
  console.error(`[openclaw-bridge-bootstrap] exited code=${code} signal=${signal}`)
  process.exit(code ?? 1)
})
