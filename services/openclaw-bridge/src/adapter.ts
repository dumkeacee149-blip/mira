import type { AssistantMessage, CommonContentPart, Message } from '@xsai/shared-chat'
import type {
  ContextUpdate,
  ContextUpdateDestinationAll,
  ContextUpdateDestinationFilter,
  ContextUpdateDestinationList,
  ContextUpdateStrategy,
  WebSocketEventOf,
  WebSocketEvents,
} from '@proj-mira/server-shared/types'
import type { Client } from '@proj-mira/server-sdk'

import { ContextUpdateStrategy as SharedContextUpdateStrategy } from '@proj-mira/server-shared/types'

interface OpenClawBridgeConfig {
  openclawBaseUrl: string
  openclawInvokePath: string
  apiKey?: string
  enableMemory: boolean
  enableAgent: boolean
  contextTopK: number
}

interface OpenClawRequestPayload {
  source: 'input:text' | 'spark:notify'
  eventId?: string
  correlationId?: string
  sessionId?: string
  prompt: string
  text?: string
  rawText?: string
  context?: {
    contextUpdates?: Array<OpenClawContextUpdate>
    overrideContextText?: string
    overrides?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
  capabilities: {
    memory: boolean
    agent: boolean
  }
}

type OpenClawContextUpdate = ContextUpdate<Record<string, unknown>, string | CommonContentPart[]>

type OpenClawOutputCommand = {
  destinations: string[]
  interrupt?: 'force' | 'soft' | false
  priority?: 'critical' | 'high' | 'normal' | 'low'
  intent?: 'plan' | 'proposal' | 'action' | 'pause' | 'resume' | 'reroute' | 'context'
  ack?: string
  guidance?: WebSocketEvents['spark:command']['guidance']
  contexts?: OpenClawContextUpdate[]
  routeTo?: string
}

interface OpenClawTextMessage {
  role: 'assistant'
  content: string
}

interface OpenClawResponse {
  ok?: boolean
  message?: string | OpenClawTextMessage
  reply?: string
  output?: {
    message?: string
    content?: string
  }
  commands?: OpenClawOutputCommand[]
  contextUpdates?: OpenClawContextUpdate[]
  context_updates?: OpenClawContextUpdate[]
  memory?: {
    short_term?: Array<OpenClawContextUpdate>
    long_term?: Array<OpenClawContextUpdate>
    episodic?: Array<OpenClawContextUpdate>
  }
}

interface OpenClawAdapterDeps {
  client: Client
  config: OpenClawBridgeConfig
}

function normalizeContextUpdateStrategy(strategy?: ContextUpdateStrategy | null): ContextUpdateStrategy {
  return strategy ?? SharedContextUpdateStrategy.AppendSelf
}

function normalizeDestinationFilter(
  destination?: Array<string> | ContextUpdateDestinationFilter,
): Array<string> | ContextUpdateDestinationFilter {
  if (!destination)
    return ['character'] as ContextUpdateDestinationList | ContextUpdateDestinationAll

  if (Array.isArray(destination))
    return destination.length > 0 ? destination : ['character']

  return destination
}

function randomId(scope: string) {
  return `${scope}-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

function toOpenClawText(raw?: OpenClawResponse['message']): OpenClawTextMessage {
  if (!raw)
    return { role: 'assistant', content: '' }

  if (typeof raw === 'string')
    return { role: 'assistant', content: raw }

  return { role: 'assistant', content: raw.content ?? '' }
}

function pickBestMessage(response: OpenClawResponse): string {
  if (response.message)
    return toOpenClawText(response.message).content
  if (typeof response.reply === 'string')
    return response.reply
  if (response.output && typeof response.output.content === 'string')
    return response.output.content
  if (typeof response.output?.message === 'string')
    return response.output.message

  return ''
}

function normalizeContextText(updates: OpenClawContextUpdate[], topK = 6) {
  if (!updates?.length)
    return ''

  return updates
    .slice(0, topK)
    .map(item => `- ${item.text}`)
    .join('\n')
}

function normalizeContextUpdate(update: OpenClawContextUpdate): OpenClawContextUpdate {
  const memoryType = (update.metadata as { memoryType?: string } | undefined)?.memoryType
  let lane = update.lane
  if (!lane) {
    if (memoryType === 'long_term')
      lane = 'memory.long_term'
    else if (memoryType === 'episodic')
      lane = 'memory.episodic'
    else if (memoryType === 'short_term')
      lane = 'memory.short_term'
    else
      lane = 'memory.context'
  }

  return {
    ...update,
    id: update.id || randomId('ctx'),
    contextId: update.contextId || randomId('ctx'),
    lane,
    strategy: normalizeContextUpdateStrategy(update.strategy),
    destinations: normalizeDestinationFilter(update.destinations),
    metadata: {
      ...(update.metadata ?? {}),
      source: 'openclaw',
      boundByOpenClaw: true,
    },
  }
}

export function createOpenClawAdapter({ client, config }: OpenClawAdapterDeps) {
  async function callOpenClaw(payload: OpenClawRequestPayload): Promise<OpenClawResponse> {
    const endpoint = new URL(config.openclawInvokePath, config.openclawBaseUrl).toString()
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    }

    if (config.apiKey)
      headers.Authorization = `Bearer ${config.apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok)
      throw new Error(`OpenClaw call failed: ${response.status} ${response.statusText}`)

    const raw = await response.text()
    try {
      return JSON.parse(raw) as OpenClawResponse
    }
    catch (error) {
      throw new Error(`OpenClaw response parse failed: ${error}. body=${raw.slice(0, 2000)}`)
    }
  }

  function sendChatReply(input: {
    sourceText: string
    sourceSessionId?: string
    replyText: string
    composed: Message[]
    metadata?: Record<string, unknown>
  }) {
    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: input.replyText,
    }

    const chatInput = {
      type: 'input:text',
      data: {
        text: input.sourceText,
        overrides: {
          sessionId: input.sourceSessionId,
        },
      },
    }

    client.send({
      type: 'output:gen-ai:chat:message',
      data: {
        message: assistantMessage,
        'gen-ai:chat': {
          message: {
            role: 'user',
            content: input.sourceText,
          },
          composedMessage: input.composed,
          contexts: {},
          input: chatInput,
        },
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    } as never)
  }

  function sendSparkCommands(sourceEventId: string, commands: OpenClawOutputCommand[]) {
    for (const command of commands) {
      const destinations = command.destinations?.length
        ? command.destinations
        : (typeof command.routeTo === 'string' ? [command.routeTo] : ['character'])

      if (!destinations.length)
        continue

      client.send({
        type: 'spark:command',
        data: {
          id: randomId('cmd'),
          eventId: sourceEventId,
          parentEventId: sourceEventId,
          commandId: randomId('command'),
          interrupt: command.interrupt ?? false,
          priority: command.priority ?? 'normal',
          intent: command.intent ?? 'action',
          ack: command.ack,
          guidance: command.guidance,
          contexts: command.contexts,
          destinations,
        },
      })
    }
  }

  function sendContextUpdates(updates: OpenClawContextUpdate[] = []) {
    const normalized = updates
      .map(normalizeContextUpdate)
      .map((update): OpenClawContextUpdate => ({
        id: update.id || randomId('ctx'),
        contextId: update.contextId || randomId('ctx'),
        lane: update.lane,
        ideas: update.ideas,
        hints: update.hints,
        strategy: normalizeContextUpdateStrategy(update.strategy),
        text: update.text,
        content: update.content,
        destinations: normalizeDestinationFilter(update.destinations),
        metadata: {
          ...(update.metadata ?? {}),
          source: 'openclaw-bridge',
        },
      }))

    for (const update of normalized)
      client.send({ type: 'context:update', data: update })
  }

  function parseContextUpdates(res: OpenClawResponse): OpenClawContextUpdate[] {
    const direct = res.contextUpdates ?? res.context_updates ?? []
    const memoryBuckets = res.memory ?? {}

    return [
      ...direct,
      ...(memoryBuckets.short_term ?? []),
      ...(memoryBuckets.long_term ?? []),
      ...(memoryBuckets.episodic ?? []),
    ]
  }

  async function handleInputText(event: WebSocketEventOf<'input:text'>) {
    if (!config.enableAgent)
      return

    const incomingContext = event.data.contextUpdates as OpenClawContextUpdate[] | undefined
    const overrideContextText = normalizeContextText(incomingContext ?? [], config.contextTopK)

    const req: OpenClawRequestPayload = {
      source: 'input:text',
      eventId: event.metadata?.event?.id,
      correlationId: event.metadata?.event?.id,
      sessionId: event.data.overrides?.sessionId,
      prompt: event.data.text,
      text: event.data.text,
      rawText: event.data.textRaw,
      context: {
        contextUpdates: incomingContext,
        overrideContextText,
        overrides: event.data.overrides ? { ...event.data.overrides } : undefined,
        metadata: event.metadata as Record<string, unknown> | undefined,
      },
      capabilities: {
        memory: config.enableMemory,
        agent: config.enableAgent,
      },
    }

    let result: OpenClawResponse
    try {
      result = await callOpenClaw(req)
    }
    catch (error) {
      result = {
        ok: false,
        message: `OpenClaw 处理失败：${error instanceof Error ? error.message : String(error)}`,
      }
    }

    const reply = pickBestMessage(result)
    if (reply)
      sendChatReply({
        sourceText: event.data.text,
        sourceSessionId: event.data.overrides?.sessionId,
        replyText: reply,
        composed: [{ role: 'assistant', content: reply }],
        metadata: event.metadata as Record<string, unknown> | undefined,
      })

    sendSparkCommands(event.metadata?.event?.id ?? randomId('evt'), result.commands ?? [])
    sendContextUpdates(parseContextUpdates(result))
  }

  async function handleSparkNotify(event: WebSocketEventOf<'spark:notify'>) {
    if (!config.enableAgent)
      return

    const prompt = `${event.data.headline}\n${event.data.note ?? ''}`

    const req: OpenClawRequestPayload = {
      source: 'spark:notify',
      eventId: event.data.id,
      correlationId: event.metadata?.event?.id,
      sessionId: event.data.payload?.['sessionId'] as string | undefined,
      prompt,
      rawText: JSON.stringify(event.data, null, 2),
      context: {
        metadata: event.metadata as Record<string, unknown> | undefined,
      },
      capabilities: {
        memory: config.enableMemory,
        agent: true,
      },
    }

    let result: OpenClawResponse
    try {
      result = await callOpenClaw(req)
    }
    catch (error) {
      result = {
        ok: false,
        message: `OpenClaw 处理失败：${error instanceof Error ? error.message : String(error)}`,
      }
    }

    const reply = pickBestMessage(result)
    if (reply)
      sendChatReply({
        sourceText: prompt,
        replyText: reply,
        composed: [{ role: 'assistant', content: reply }],
        metadata: event.metadata as Record<string, unknown> | undefined,
      })

    sendSparkCommands(event.data.id, result.commands ?? [])
    sendContextUpdates(parseContextUpdates(result))
  }

  function initialize() {
    client.onEvent('input:text', event => {
      void handleInputText(event)
    })

    client.onEvent('spark:notify', event => {
      void handleSparkNotify(event)
    })
  }

  return { initialize }
}
