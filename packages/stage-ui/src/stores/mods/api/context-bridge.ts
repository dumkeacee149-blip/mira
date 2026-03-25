import type { ChatProvider } from '@xsai-ext/providers/utils'
import type { UserMessage } from '@xsai/shared-chat'

import type { ChatAssistantMessage, ChatStreamEvent, ContextMessage } from '../../../types/chat'

import { isStageTamagotchi, isStageWeb } from '@proj-mira/stage-shared'
import { useBroadcastChannel } from '@vueuse/core'
import { Mutex } from 'es-toolkit'
import { nanoid } from 'nanoid'
import { defineStore, storeToRefs } from 'pinia'
import { ref, toRaw, watch } from 'vue'

import { useChatOrchestratorStore } from '../../chat'
import { CHAT_STREAM_CHANNEL_NAME, CONTEXT_CHANNEL_NAME } from '../../chat/constants'
import { useChatContextStore } from '../../chat/context-store'
import { useChatSessionStore } from '../../chat/session-store'
import { useChatStreamStore } from '../../chat/stream-store'
import { useConsciousnessStore } from '../../modules/consciousness'
import { useMemoryStore } from '../../modules/memory'
import { useOpenClawStore } from '../../modules/openclaw'
import { useProvidersStore } from '../../providers'
import { useModsServerChannelStore } from './channel-server'

export const useContextBridgeStore = defineStore('mods:api:context-bridge', () => {
  const mutex = new Mutex()

  const chatOrchestrator = useChatOrchestratorStore()
  const chatSession = useChatSessionStore()
  const chatStream = useChatStreamStore()
  const chatContext = useChatContextStore()
  const memoryStore = useMemoryStore()
  const serverChannelStore = useModsServerChannelStore()
  const consciousnessStore = useConsciousnessStore()
  const openClawStore = useOpenClawStore()
  const providersStore = useProvidersStore()
  const { activeProvider, activeModel } = storeToRefs(consciousnessStore)

  const { post: broadcastContext, data: incomingContext } = useBroadcastChannel<ContextMessage, ContextMessage>({ name: CONTEXT_CHANNEL_NAME })
  const { post: broadcastStreamEvent, data: incomingStreamEvent } = useBroadcastChannel<ChatStreamEvent, ChatStreamEvent>({ name: CHAT_STREAM_CHANNEL_NAME })

  const disposeHookFns = ref<Array<() => void>>([])
  let remoteStreamGuard: { sessionId: string, generation: number } | null = null

  function normalizeContentText(content: unknown) {
    if (typeof content === 'string')
      return content

    if (!Array.isArray(content))
      return ''

    return content.map((part) => {
      if (typeof part === 'string')
        return part
      if (part && typeof part === 'object' && 'text' in part)
        return String(part.text ?? '')
      return ''
    }).join('')
  }

  function resolveTargetSessionId(payload: Record<string, any>) {
    return payload['gen-ai:chat']?.input?.data?.overrides?.sessionId
      ?? payload.overrides?.sessionId
      ?? chatSession.activeSessionId
  }

  function normalizeAssistantMessage(message: Record<string, any> | undefined): ChatAssistantMessage & { id: string, createdAt: number } {
    const content = normalizeContentText(message?.content)

    return {
      ...message,
      role: 'assistant',
      content,
      id: typeof message?.id === 'string' ? message.id : nanoid(),
      createdAt: typeof message?.createdAt === 'number' ? message.createdAt : Date.now(),
      slices: Array.isArray(message?.slices)
        ? message.slices
        : content
          ? [{ type: 'text', text: content }]
          : [],
      tool_results: Array.isArray(message?.tool_results) ? message.tool_results : [],
    }
  }

  function syncRemoteUserMessage(payload: Record<string, any>) {
    const targetSessionId = resolveTargetSessionId(payload)
    if (!targetSessionId)
      return

    const messagePrefix = typeof payload.overrides?.messagePrefix === 'string'
      ? payload.overrides.messagePrefix
      : ''
    const content = `${messagePrefix}${payload.text ?? ''}`
    const messageId = typeof payload.overrides?.sessionMessageId === 'string'
      ? payload.overrides.sessionMessageId
      : nanoid()
    const createdAt = typeof payload.overrides?.sessionMessageCreatedAt === 'number'
      ? payload.overrides.sessionMessageCreatedAt
      : Date.now()

    chatSession.upsertMessage(targetSessionId, {
      id: messageId,
      role: 'user',
      content,
      createdAt,
    })
  }

  async function initialize() {
    await mutex.acquire()

    try {
      let isProcessingRemoteStream = false

      const { stop } = watch(incomingContext, (event) => {
        if (event) {
          chatContext.ingestContextMessage(event)
          memoryStore.ingestContextMessage(event)
        }
      })
      disposeHookFns.value.push(stop)

      disposeHookFns.value.push(serverChannelStore.onContextUpdate((event) => {
        const contextMessage: ContextMessage = {
          ...event.data,
          metadata: event.metadata,
          createdAt: Date.now(),
        }
        chatContext.ingestContextMessage(contextMessage)
        memoryStore.ingestContextMessage(contextMessage)
        broadcastContext(toRaw(contextMessage))
      }))

      disposeHookFns.value.push(serverChannelStore.onEvent('input:text', async (event) => {
        const {
          text,
          textRaw,
          overrides,
          contextUpdates,
        } = event.data

        const normalizedContextUpdates = contextUpdates?.map((update) => {
          const id = update.id ?? nanoid()
          const contextId = update.contextId ?? id
          return {
            ...update,
            id,
            contextId,
          }
        })

        if (normalizedContextUpdates?.length) {
          const createdAt = Date.now()
          for (const update of normalizedContextUpdates) {
            const contextEnvelope = {
              ...update,
              metadata: event.metadata,
              createdAt,
            }
            chatContext.ingestContextMessage(contextEnvelope)
            memoryStore.ingestContextMessage(contextEnvelope)
          }
        }

        if (openClawStore.canRouteViaOpenClaw || event.data.overrides?.openclawRouted === true) {
          syncRemoteUserMessage({
            ...event.data,
            contextUpdates: normalizedContextUpdates,
          })
          return
        }

        if (activeProvider.value && activeModel.value) {
          let chatProvider: ChatProvider
          try {
            chatProvider = await providersStore.getProviderInstance<ChatProvider>(activeProvider.value)
          }
          catch (err) {
            console.error('[context-bridge] getProviderInstance failed for provider:', activeProvider.value, err)
            return
          }

          let messageText = text
          const targetSessionId = overrides?.sessionId

          if (overrides?.messagePrefix) {
            messageText = `${overrides.messagePrefix}${text}`
          }

          // TODO(@nekomeowww): This only guard for input:text events handling and doesn't cover the entire ingestion
          // process. Another critical path of spark:notify is affected too, I think for better future development
          // experience, we should discover and find either a leader election or distributed lock solution to
          // coordinate the modules that handles context bridge ingestion across multiple windows/tabs.
          //
          // Background behind this, as server-sdk is in fact integrated in every Stage Web window/tab, each
          // window/tab has its own connection & chat orchestrator instance, when multiple windows/tabs are open,
          // each of them will receive the same input:text event and process ingestion independently, causing
          // duplicated messages handling and output:* events emission.
          //
          // We don't have ability to control how many windows/tabs the user will open (sometimes) user will forget
          // to close the extra windows/tabs, so we need a way to coordinate the ingestion processing to
          // ensure only one window/tab is handling the ingestion at a time.
          //
          // SharedWorker solution was considered but it's completely disabled in Chromium based Android browsers
          // (which is a big portion of mobile Stage Web users as stage-ui serves as the unified / universal
          // api wrapper for most of the shared logic across Web, Pocket, and Tamagotchi).
          //
          // Read more here:
          // - https://chromestatus.com/feature/6265472244514816
          // - https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker
          // - https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
          navigator.locks.request('context-bridge:event:input:text', async () => {
            try {
              await chatOrchestrator.ingest(messageText, {
                model: activeModel.value,
                chatProvider,
                input: {
                  type: 'input:text',
                  data: {
                    ...event.data,
                    text,
                    textRaw,
                    overrides,
                    contextUpdates: normalizedContextUpdates,
                  },
                },
              }, targetSessionId)
            }
            catch (err) {
              console.error('Error ingesting text input via context bridge:', err)
            }
          })
        }
      }))

      disposeHookFns.value.push(serverChannelStore.onEvent('output:gen-ai:chat:message', async (event) => {
        const payload = event.data as Record<string, any>
        const isOpenClawReply = payload.metadata?.openclaw === true
        const isOpenClawRouted = payload['gen-ai:chat']?.input?.data?.overrides?.openclawRouted === true
        if (!openClawStore.configured && !isOpenClawRouted && !isOpenClawReply)
          return

        const targetSessionId = resolveTargetSessionId(payload)
        if (!targetSessionId)
          return

        const message = normalizeAssistantMessage(payload.message as Record<string, any> | undefined)
        openClawStore.markRemoteMessage(targetSessionId)

        if (targetSessionId !== chatSession.activeSessionId)
          return

        remoteStreamGuard = {
          sessionId: targetSessionId,
          generation: chatSession.getSessionGenerationValue(targetSessionId),
        }
        chatOrchestrator.sending = true
        chatStream.beginStream()
        chatStream.hydrateStreamMessage(message)
      }))

      disposeHookFns.value.push(serverChannelStore.onEvent('output:gen-ai:chat:complete', async (event) => {
        const payload = event.data as Record<string, any>
        const isOpenClawReply = payload.metadata?.openclaw === true
        const isOpenClawRouted = payload['gen-ai:chat']?.input?.data?.overrides?.openclawRouted === true
        if (!openClawStore.configured && !isOpenClawRouted && !isOpenClawReply)
          return

        const targetSessionId = resolveTargetSessionId(payload)
        if (!targetSessionId)
          return

        const message = normalizeAssistantMessage(payload.message as Record<string, any> | undefined)
        const guardedSessionMatched = remoteStreamGuard?.sessionId === targetSessionId

        openClawStore.markRemoteComplete(targetSessionId)

        if (targetSessionId === chatSession.activeSessionId) {
          const guardGeneration = remoteStreamGuard?.sessionId === targetSessionId
            ? remoteStreamGuard?.generation
            : undefined
          const expectedGeneration = guardGeneration ?? chatSession.getSessionGenerationValue(targetSessionId)

          if (chatSession.getSessionGenerationValue(targetSessionId) === expectedGeneration && !chatSession.hasMessage(targetSessionId, message.id)) {
            chatStream.hydrateStreamMessage(message)
            chatStream.finalizeStream()
          }
          else {
            chatStream.resetStream()
          }

          chatOrchestrator.sending = false
        }
        else if (!chatSession.hasMessage(targetSessionId, message.id)) {
          chatSession.upsertMessage(targetSessionId, message)
        }

        if (guardedSessionMatched) {
          chatOrchestrator.sending = false
          if (targetSessionId !== chatSession.activeSessionId)
            chatStream.resetStream()
        }

        remoteStreamGuard = null
      }))

      disposeHookFns.value.push(
        chatOrchestrator.onBeforeMessageComposed(async (message, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'before-compose', message, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onAfterMessageComposed(async (message, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'after-compose', message, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onBeforeSend(async (message, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'before-send', message, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onAfterSend(async (message, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'after-send', message, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onTokenLiteral(async (literal, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'token-literal', literal, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onTokenSpecial(async (special, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'token-special', special, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onStreamEnd(async (context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'stream-end', sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),
        chatOrchestrator.onAssistantResponseEnd(async (message, context) => {
          if (isProcessingRemoteStream)
            return

          broadcastStreamEvent({ type: 'assistant-end', message, sessionId: chatSession.activeSessionId, context: structuredClone(toRaw(context)) })
        }),

        chatOrchestrator.onAssistantMessage(async (message, _messageText, context) => {
          serverChannelStore.send({
            type: 'output:gen-ai:chat:message',
            data: {
              ...context.input?.data,
              message,
              'stage-web': isStageWeb(),
              'stage-tamagotchi': isStageTamagotchi(),
              'gen-ai:chat': {
                message: context.message as UserMessage,
                composedMessage: context.composedMessage,
                contexts: context.contexts,
                input: context.input,
              },
            },
          })
        }),

        chatOrchestrator.onChatTurnComplete(async (chat, context) => {
          serverChannelStore.send({
            type: 'output:gen-ai:chat:complete',
            data: {
              ...context.input?.data,
              'message': chat.output,
              // TODO: tool calls should be captured properly
              'toolCalls': [],
              'stage-web': isStageWeb(),
              'stage-tamagotchi': isStageTamagotchi(),
              // TODO: Properly calculate usage data
              'usage': {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                source: 'estimate-based',
              },
              'gen-ai:chat': {
                message: context.message as UserMessage,
                composedMessage: context.composedMessage,
                contexts: context.contexts,
                input: context.input,
              },
            },
          })
        }),
      )

      const { stop: stopIncomingStreamWatch } = watch(incomingStreamEvent, async (event) => {
        if (!event)
          return

        isProcessingRemoteStream = true

        try {
          // Use the receiver's active session to avoid clobbering chat state when events come from other windows/devtools.
          switch (event.type) {
            case 'before-compose':
              await chatOrchestrator.emitBeforeMessageComposedHooks(event.message, event.context)
              break
            case 'after-compose':
              await chatOrchestrator.emitAfterMessageComposedHooks(event.message, event.context)
              break
            case 'before-send':
              await chatOrchestrator.emitBeforeSendHooks(event.message, event.context)
              remoteStreamGuard = {
                sessionId: chatSession.activeSessionId,
                generation: chatSession.getSessionGenerationValue(),
              }
              chatOrchestrator.sending = true
              chatStream.beginStream()
              break
            case 'after-send':
              await chatOrchestrator.emitAfterSendHooks(event.message, event.context)
              break
            case 'token-literal':
              if (!remoteStreamGuard)
                return
              if (remoteStreamGuard.sessionId !== chatSession.activeSessionId)
                return
              if (chatSession.getSessionGenerationValue(remoteStreamGuard.sessionId) !== remoteStreamGuard.generation)
                return
              chatStream.appendStreamLiteral(event.literal)
              await chatOrchestrator.emitTokenLiteralHooks(event.literal, event.context)
              break
            case 'token-special':
              await chatOrchestrator.emitTokenSpecialHooks(event.special, event.context)
              break
            case 'stream-end':
              if (!remoteStreamGuard)
                break
              if (remoteStreamGuard.sessionId !== chatSession.activeSessionId)
                break
              if (chatSession.getSessionGenerationValue(remoteStreamGuard.sessionId) !== remoteStreamGuard.generation)
                break
              await chatOrchestrator.emitStreamEndHooks(event.context)
              chatStream.finalizeStream()
              chatOrchestrator.sending = false
              remoteStreamGuard = null
              break
            case 'assistant-end':
              if (!remoteStreamGuard)
                break
              if (remoteStreamGuard.sessionId !== chatSession.activeSessionId)
                break
              if (chatSession.getSessionGenerationValue(remoteStreamGuard.sessionId) !== remoteStreamGuard.generation)
                break
              await chatOrchestrator.emitAssistantResponseEndHooks(event.message, event.context)
              chatStream.finalizeStream(event.message)
              chatOrchestrator.sending = false
              remoteStreamGuard = null
              break
          }
        }
        finally {
          isProcessingRemoteStream = false
        }
      })
      disposeHookFns.value.push(stopIncomingStreamWatch)
    }
    finally {
      mutex.release()
    }
  }

  async function dispose() {
    await mutex.acquire()

    try {
      for (const fn of disposeHookFns.value) {
        fn()
      }
    }
    finally {
      mutex.release()
    }

    disposeHookFns.value = []
  }

  return {
    initialize,
    dispose,
  }
})
