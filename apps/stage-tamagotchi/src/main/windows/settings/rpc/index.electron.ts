import type { BrowserWindow } from 'electron'

import type { I18n } from '../../../libs/i18n'
import type { AutoUpdater } from '../../../services/electron/auto-updater'
import type { ServerChannel } from '../../../services/mira/channel-server'
import type { McpStdioManager } from '../../../services/mira/mcp-servers'
import type { DevtoolsWindowManager } from '../../devtools'
import type { WidgetsWindowManager } from '../../widgets'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext } from '@moeru/eventa/adapters/electron/main'
import { ipcMain } from 'electron'

import { electronOpenDevtoolsWindow, electronOpenSettingsDevtools } from '../../../../shared/eventa'
import { createAutoUpdaterService } from '../../../services/electron'
import { createLocalRuntimeService } from '../../../services/local-runtime'
import { createMcpServersService } from '../../../services/mira/mcp-servers'
import { createWidgetsService } from '../../../services/mira/widgets'
import { setupBaseWindowElectronInvokes } from '../../shared/window'

export async function setupSettingsWindowInvokes(params: {
  settingsWindow: BrowserWindow
  widgetsManager: WidgetsWindowManager
  autoUpdater: AutoUpdater
  devtoolsMarkdownStressWindow: DevtoolsWindowManager
  serverChannel: ServerChannel
  mcpStdioManager: McpStdioManager
  i18n: I18n
}) {
  // TODO: once we refactored eventa to support window-namespaced contexts,
  // we can remove the setMaxListeners call below since eventa will be able to dispatch and
  // manage events within eventa's context system.
  ipcMain.setMaxListeners(0)

  const { context } = createContext(ipcMain, params.settingsWindow)

  await setupBaseWindowElectronInvokes({ context, window: params.settingsWindow, i18n: params.i18n, serverChannel: params.serverChannel })

  createWidgetsService({ context, widgetsManager: params.widgetsManager, window: params.settingsWindow })
  createAutoUpdaterService({ context, window: params.settingsWindow, service: params.autoUpdater })
  createMcpServersService({ context, manager: params.mcpStdioManager })
  createLocalRuntimeService(context)

  defineInvokeHandler(context, electronOpenSettingsDevtools, async () => params.settingsWindow.webContents.openDevTools({ mode: 'detach' }))
  defineInvokeHandler(context, electronOpenDevtoolsWindow, async (payload) => {
    await params.devtoolsMarkdownStressWindow.openWindow(payload?.route)
  })

  return context
}
