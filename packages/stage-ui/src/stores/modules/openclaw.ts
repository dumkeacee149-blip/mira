import type { ContextUpdate } from '@proj-mira/server-sdk'
import type { CommonContentPart } from '@xsai/shared-chat'

import { errorMessageFrom } from '@moeru/std'
import { useLocalStorageManualReset } from '@proj-mira/stage-shared/composables'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useChatOrchestratorStore } from '../chat'
import { useChatSessionStore } from '../chat/session-store'
import { useChatStreamStore } from '../chat/stream-store'
import { useModsServerChannelStore } from '../mods/api/channel-server'

interface PendingOpenClawRequest {
  requestId: string
  sessionId: string
  messageId: string
  startedAt: number
}

interface OpenClawRuntimeHealth {
  ok: boolean
  checkedAt: number
  service?: string
  upstream?: boolean
  upstreamUrl?: string | null
  error?: string
}

interface RouteTextInputOptions {
  sessionId?: string
  overrides?: Record<string, unknown>
  contextUpdates?: Array<ContextUpdate<Record<string, unknown>, string | CommonContentPart[]>>
}

const defaultRuntimeHealthUrl = import.meta.env.VITE_OPENCLAW_RUNTIME_HEALTH_URL || 'http://localhost:8123/health'

export const useOpenClawStore = defineStore('openclaw', () => {
  const serverChannelStore = useModsServerChannelStore()
  const chatOrchestrator = useChatOrchestratorStore()
  const chatSession = useChatSessionStore()
  const chatStream = useChatStreamStore()

  const enabled = useLocalStorageManualReset<boolean>('settings/openclaw/enabled', true)
  const routeChatInput = useLocalStorageManualReset<boolean>('settings/openclaw/route-chat-input', true)
  const runtimeHealthUrl = useLocalStorageManualReset<string>('settings/openclaw/runtime-health-url', defaultRuntimeHealthUrl)
  const responseTimeoutMs = useLocalStorageManualReset<number>('settings/openclaw/response-timeout-ms', 45_000)

  const lastError = ref('')
  const lastRoutedAt = ref<number>()
  const lastRemoteMessageAt = ref<number>()
  const lastRemoteCompleteAt = ref<number>()
  const refreshingHealth = ref(false)
  const runtimeHealth = ref<OpenClawRuntimeHealth | null>(null)
  const pendingRequests = ref<Record<string, PendingOpenClawRequest>>({})

  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  const channelConnected = computed(() => serverChannelStore.connected)
  const configured = computed(() => enabled.value && routeChatInput.value)
  const canRouteViaOpenClaw = computed(() => configured.value && channelConnected.value)
  const hasPendingRequest = computed(() => Object.keys(pendingRequests.value).length > 0)
  const lastActivityAt = computed(() => lastRemoteCompleteAt.value ?? lastRemoteMessageAt.value ?? lastRoutedAt.value)
  const runtimeReady = computed(() => runtimeHealth.value?.ok ?? false)

  function clearPendingSession(sessionId: string) {
    const timer = pendingTimers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      pendingTimers.delete(sessionId)
    }

    if (!pendingRequests.value[sessionId])
      return

    const { [sessionId]: _removed, ...rest } = pendingRequests.value
    pendingRequests.value = rest
  }

  function markRemoteMessage(sessionId?: string) {
    lastRemoteMessageAt.value = Date.now()
    lastError.value = ''

    if (sessionId)
      clearPendingSession(sessionId)
  }

  function markRemoteComplete(sessionId?: string) {
    lastRemoteCompleteAt.value = Date.now()
    lastError.value = ''

    if (sessionId)
      clearPendingSession(sessionId)
  }

  function pushTimeoutError(sessionId: string, requestId: string) {
    const pending = pendingRequests.value[sessionId]
    if (!pending || pending.requestId !== requestId)
      return

    clearPendingSession(sessionId)
    lastError.value = 'OpenClaw did not respond before the request timed out.'

    if (chatSession.activeSessionId === sessionId) {
      chatOrchestrator.sending = false
      chatStream.resetStream()
    }

    const errorMessageId = `openclaw-timeout-${pending.messageId}`
    if (chatSession.hasMessage(sessionId, errorMessageId))
      return

    chatSession.upsertMessage(sessionId, {
      id: errorMessageId,
      role: 'error',
      content: lastError.value,
      createdAt: Date.now(),
    })
  }

  async function routeTextInput(text: string, options?: RouteTextInputOptions) {
    const sessionId = options?.sessionId ?? chatSession.activeSessionId
    if (!sessionId) {
      throw new Error('No active chat session available for OpenClaw routing.')
    }

    const createdAt = Date.now()
    const messageId = nanoid()
    const requestId = nanoid()

    chatSession.upsertMessage(sessionId, {
      id: messageId,
      role: 'user',
      content: text,
      createdAt,
    })

    if (chatSession.activeSessionId === sessionId) {
      chatOrchestrator.sending = true
      chatStream.beginStream()
    }

    lastError.value = ''
    lastRoutedAt.value = createdAt
    pendingRequests.value = {
      ...pendingRequests.value,
      [sessionId]: {
        requestId,
        sessionId,
        messageId,
        startedAt: createdAt,
      },
    }

    const timeoutMs = Math.max(5_000, Number(responseTimeoutMs.value) || 45_000)
    const timer = setTimeout(() => {
      pushTimeoutError(sessionId, requestId)
    }, timeoutMs)
    pendingTimers.set(sessionId, timer)

    serverChannelStore.send({
      type: 'input:text',
      data: {
        text,
        textRaw: text,
        contextUpdates: options?.contextUpdates,
        overrides: {
          ...options?.overrides,
          openclawRouted: true,
          sessionId,
          requestId,
          sessionMessageId: messageId,
          sessionMessageCreatedAt: createdAt,
        } as never,
      },
    })
  }

  async function refreshRuntimeHealth() {
    const target = runtimeHealthUrl.value?.trim()
    if (!target) {
      runtimeHealth.value = null
      lastError.value = ''
      return null
    }

    refreshingHealth.value = true

    try {
      const response = await fetch(target, {
        cache: 'no-store',
      })

      const raw = await response.json() as Record<string, unknown>
      runtimeHealth.value = {
        ok: response.ok && raw.ok !== false,
        checkedAt: Date.now(),
        service: typeof raw.service === 'string' ? raw.service : undefined,
        upstream: typeof raw.upstream === 'boolean' ? raw.upstream : undefined,
        upstreamUrl: typeof raw.upstreamUrl === 'string' ? raw.upstreamUrl : null,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      }
      lastError.value = ''
      return runtimeHealth.value
    }
    catch (error) {
      runtimeHealth.value = {
        ok: false,
        checkedAt: Date.now(),
        error: errorMessageFrom(error) ?? 'Failed to reach OpenClaw runtime health endpoint.',
      }
      lastError.value = runtimeHealth.value.error ?? ''
      return runtimeHealth.value
    }
    finally {
      refreshingHealth.value = false
    }
  }

  function resetState() {
    enabled.reset()
    routeChatInput.reset()
    runtimeHealthUrl.reset()
    responseTimeoutMs.reset()
    lastError.value = ''
    lastRoutedAt.value = undefined
    lastRemoteMessageAt.value = undefined
    lastRemoteCompleteAt.value = undefined
    runtimeHealth.value = null

    for (const sessionId of Object.keys(pendingRequests.value))
      clearPendingSession(sessionId)
  }

  function clearError() {
    lastError.value = ''
    if (runtimeHealth.value)
      runtimeHealth.value = { ...runtimeHealth.value, error: undefined }
  }

  return {
    enabled,
    routeChatInput,
    runtimeHealthUrl,
    responseTimeoutMs,

    configured,
    channelConnected,
    canRouteViaOpenClaw,
    hasPendingRequest,
    runtimeReady,
    runtimeHealth,
    refreshingHealth,
    lastError,
    lastActivityAt,
    lastRoutedAt,
    lastRemoteMessageAt,
    lastRemoteCompleteAt,

    routeTextInput,
    refreshRuntimeHealth,
    markRemoteMessage,
    markRemoteComplete,
    clearError,
    resetState,
  }
})
