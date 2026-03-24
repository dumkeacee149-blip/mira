import type { Config } from '../config/types'
import type { Context } from '../core/browser/context'
import type { MiraAdapter } from './mira-adapter'
import type { MCPAdapter } from './mcp-adapter'

import { logger } from '../utils/logger'

export function useAdapter() {
  const adapters: { mira?: MiraAdapter, mcp?: MCPAdapter } = {}

  async function initAdapters(config: Config, ctx: Context): Promise<{ mira?: MiraAdapter, mcp?: MCPAdapter }> {
    if (config.adapters.mira?.enabled) {
      logger.main.log('Starting Mira adapter...')
      const { MiraAdapter } = await import('./mira-adapter')

      adapters.mira = new MiraAdapter(ctx, {
        url: config.adapters.mira.url,
        token: config.adapters.mira.token,
        credentials: config.credentials || {},
      })

      await adapters.mira.start()
      logger.main.log('Mira adapter started')
    }

    if (config.adapters.mcp?.enabled) {
      logger.main.log('Starting MCP adapter...')
      const { MCPAdapter } = await import('./mcp-adapter')

      adapters.mcp = new MCPAdapter(config.adapters.mcp.port, ctx)

      await adapters.mcp.start()
      logger.main.log('MCP adapter started')
    }

    return adapters
  }

  return {
    adapters,
    initAdapters,
  }
}
