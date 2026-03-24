import type { ChildProcessWithoutNullStreams } from 'node:child_process'

import process from 'node:process'

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineInvokeHandler } from '@moeru/eventa'
import { app } from 'electron'

import { electronRuntimeGetStatus, electronRuntimeRestart } from '../../shared/eventa'

export interface LocalRuntimeServiceStatus {
  managed: boolean
  processes: LocalRuntimeProcessStatus[]
}

export interface LocalRuntimeProcessStatus {
  name: string
  startedAt?: number
  command: string
  healthy?: boolean
  lastError?: string
  enabled: boolean
  pid: number | null
}

interface RuntimeCommandConfig {
  command: string
  args: string[]
  name: string
  cwd?: string
}

interface RuntimeProcess {
  name: string
  process?: ChildProcessWithoutNullStreams
  command: string
  healthUrl?: string
  enabled: boolean
  startedAt?: number
  lastError?: string
  healthy?: boolean
}

interface StartRuntimeOptions {
  commands: RuntimeCommandConfig[]
  healthChecks: Array<{ name: string, url?: string, intervalMs: number }>
}

function splitCommand(commandLine: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < commandLine.length; i++) {
    const char = commandLine[i]

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        result.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current.trim())
    result.push(current)

  return result
}

function parseCommand(raw: string): RuntimeCommandConfig | null {
  const trimmed = raw.trim()
  if (!trimmed)
    return null

  const segments = splitCommand(trimmed)
  if (!segments.length)
    return null

  return {
    command: segments[0],
    args: segments.slice(1),
    name: segments[0],
  }
}

function readBundledRuntimeCommand(key: 'bridge' | 'runtime'): string | null {
  if (!app.isPackaged)
    return null

  const appBaseDir = process.resourcesPath
  const candidates = {
    bridge: [
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-bridge', 'openclaw-bridge.exe'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-bridge', 'openclaw-bridge.mjs'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-bridge', 'openclaw-bridge.js'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-bridge', 'index.js'),
    ],
    runtime: [
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-runtime', 'openclaw-runtime.exe'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-runtime', 'openclaw-runtime.mjs'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-runtime', 'openclaw-runtime.js'),
      resolve(appBaseDir, 'embedded-runtime', 'openclaw-runtime', 'index.js'),
    ],
  }

  const found = candidates[key].find(path => existsSync(path))
  if (!found)
    return null

  const nodePath = process.execPath
  if (found.endsWith('.mjs') || found.endsWith('.js'))
    return `${nodePath} "${found}"`

  return `"${found}"`
}

async function waitForProcessExit(proc: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve) => {
    proc.once('exit', () => {
      resolve()
    })
    proc.once('error', () => {
      resolve()
    })
  })
}

export class LocalRuntimeCoordinator {
  private processes = new Map<string, RuntimeProcess>()
  private stopSignals: Array<() => Promise<void>> = []

  async start(options: StartRuntimeOptions) {
    if (!this.shouldRunEmbedded())
      return

    for (const command of options.commands)
      this.startProcess(command)

    for (const check of options.healthChecks)
      this.startHealthCheck(check.name, check.url, check.intervalMs)
  }

  async restart() {
    await this.stopAll()
    const options = parseRuntimeCommandsFromEnv()
    await this.start(options)
  }

  shouldRunEmbedded() {
    const mode = app.isPackaged ? 'packaged' : 'dev'
    const enabled = process.env.MIRA_RUNTIME_MANAGED || (mode === 'packaged' ? 'true' : 'false')
    return enabled === '1' || String(enabled).toLowerCase() === 'true'
  }

  getStatus(): LocalRuntimeServiceStatus {
    return {
      managed: this.shouldRunEmbedded(),
      processes: [...this.processes.values()].map(proc => ({
        name: proc.name,
        startedAt: proc.startedAt,
        command: proc.command,
        healthy: proc.healthy,
        lastError: proc.lastError,
        enabled: proc.enabled,
        pid: proc.process?.pid ?? null,
      })),
    }
  }

  private getProcessLoggerName(name: string) {
    return `[local-runtime:${name}]`
  }

  private startProcess(command: RuntimeCommandConfig) {
    const info = this.processes.get(command.name)
    if (info?.process && !info.process.killed)
      return

    const proc = spawn(command.command, command.args, {
      cwd: command.cwd ? resolve(command.cwd) : process.cwd(),
      detached: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MIRA_RUNTIME_MODE: 'embedded',
      },
    })

    const runtimeInfo: RuntimeProcess = {
      name: command.name,
      process: proc,
      command: `${command.command} ${command.args.join(' ')}`,
      enabled: true,
      startedAt: Date.now(),
    }
    this.processes.set(command.name, runtimeInfo)

    proc.stdout?.on('data', (chunk) => {
      console.info(`${this.getProcessLoggerName(command.name)} ${chunk.toString().trim()}`)
    })

    proc.stderr?.on('data', (chunk) => {
      console.error(`${this.getProcessLoggerName(command.name)} ${chunk.toString().trim()}`)
    })

    proc.on('error', (error) => {
      runtimeInfo.lastError = String(error)
      runtimeInfo.healthy = false
      console.error(`${this.getProcessLoggerName(command.name)} failed:`, error)
    })

    const stop = async () => {
      if (!runtimeInfo.process || runtimeInfo.process.killed)
        return

      runtimeInfo.process.kill()
      runtimeInfo.healthy = false
      await waitForProcessExit(runtimeInfo.process)
    }

    this.stopSignals.push(stop)
  }

  private startHealthCheck(name: string, url?: string, intervalMs = 10_000) {
    if (!url)
      return

    const tick = async () => {
      const runtime = this.processes.get(name)
      if (!runtime)
        return

      try {
        const res = await fetch(url, { method: 'GET' })
        const ok = res.ok
        runtime.healthy = ok
        if (!ok)
          runtime.lastError = `HTTP ${res.status}`
      }
      catch (error) {
        runtime.healthy = false
        runtime.lastError = error instanceof Error ? error.message : String(error)
      }
    }

    const timer = setInterval(() => {
      void tick()
    }, intervalMs)

    void tick()

    this.stopSignals.push(async () => {
      clearInterval(timer)
    })
  }

  async stopAll() {
    await Promise.all(this.stopSignals.map(stop => stop()))
    this.stopSignals = []

    for (const proc of this.processes.values()) {
      if (proc.process && !proc.process.killed)
        proc.process.kill()
    }

    this.processes.clear()
  }
}

export function parseRuntimeCommandsFromEnv(): StartRuntimeOptions {
  const bridgeCmd = process.env.OPENCLAW_BRIDGE_COMMAND || readBundledRuntimeCommand('bridge')
  const runtimeCmd = process.env.OPENCLAW_RUNTIME_COMMAND || readBundledRuntimeCommand('runtime')

  const defaultHealthBase = app.isPackaged ? 'http://127.0.0.1:8123' : 'http://127.0.0.1:8000'
  const bridgeHealth = process.env.OPENCLAW_BRIDGE_HEALTH_URL || `${defaultHealthBase}/health`
  const runtimeHealth = process.env.OPENCLAW_RUNTIME_HEALTH_URL || `${defaultHealthBase}/health`
  const runtimeManaged = process.env.MIRA_RUNTIME_MANAGED
  const defaultBridgeBaseUrl = app.isPackaged ? 'http://127.0.0.1:8123' : 'http://127.0.0.1:8000'

  if (app.isPackaged && !process.env.OPENCLAW_BASE_URL)
    process.env.OPENCLAW_BASE_URL = defaultBridgeBaseUrl

  if (app.isPackaged && !process.env.OPENCLAW_INVOKE_PATH)
    process.env.OPENCLAW_INVOKE_PATH = '/v1/mira/invoke'

  if (app.isPackaged && !process.env.OPENCLAW_MIRA_WS_URL)
    process.env.OPENCLAW_MIRA_WS_URL = 'ws://127.0.0.1:6121/ws'

  const commands: RuntimeCommandConfig[] = []
  const bridgeParsed = bridgeCmd ? parseCommand(bridgeCmd) : null
  const runtimeParsed = runtimeCmd ? parseCommand(runtimeCmd) : null

  if (runtimeManaged)
    console.info(`[local-runtime] MIRA_RUNTIME_MANAGED=${runtimeManaged}`)

  if (bridgeParsed)
    commands.push({ ...bridgeParsed, name: 'openclaw-bridge' })
  if (runtimeParsed)
    commands.push({ ...runtimeParsed, name: 'openclaw-runtime' })

  return {
    commands,
    healthChecks: [
      ...(bridgeParsed
        ? [{
            name: 'openclaw-bridge',
            url: bridgeHealth,
            intervalMs: 12_000,
          }]
        : []),
      ...(runtimeParsed
        ? [{
            name: 'openclaw-runtime',
            url: runtimeHealth,
            intervalMs: 12_000,
          }]
        : []),
    ],
  }
}

export const runtimeCoordinator = new LocalRuntimeCoordinator()

export function createLocalRuntimeService(context: any) {
  defineInvokeHandler(context, electronRuntimeGetStatus, async () => {
    return runtimeCoordinator.getStatus()
  })

  defineInvokeHandler(context, electronRuntimeRestart, async () => {
    await runtimeCoordinator.restart()
  })
}
