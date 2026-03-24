import { ContextUpdateStrategy as SharedContextUpdateStrategy } from '@proj-mira/server-shared/types'

const GEN_AI_CHAT_KEY = 'gen-ai:chat'

function envBool(raw, fallback) {
  if (typeof raw === 'undefined')
    return fallback

  const normalized = String(raw).toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes')
    return true
  if (normalized === '0' || normalized === 'false' || normalized === 'no')
    return false

  return fallback
}

function envNumber(raw, fallback) {
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0)
    return n
  return fallback
}

function normalizeContextUpdateStrategy(strategy) {
  return strategy ?? SharedContextUpdateStrategy.AppendSelf
}

function normalizeDestinationFilter(destination) {
  if (!destination)
    return ['character']
  if (Array.isArray(destination))
    return destination.length > 0 ? destination : ['character']
  return destination
}

function randomId(scope) {
  return `${scope}-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

function toOpenClawText(raw) {
  if (!raw)
    return { role: 'assistant', content: '' }

  if (typeof raw === 'string')
    return { role: 'assistant', content: raw }

  return { role: 'assistant', content: raw.content ?? '' }
}

function pickBestMessage(response) {
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

function normalizeContextText(updates, topK = 6) {
  if (!updates?.length)
    return ''

  return updates
    .slice(0, topK)
    .map(item => `- ${item.text}`)
    .join('\n')
}

function normalizeContextUpdate(update) {
  const memoryType = update?.metadata?.memoryType
  let lane = update?.lane

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

function parseContextUpdates(response) {
  const direct = response.contextUpdates ?? response.context_updates ?? []
  const memoryBuckets = response.memory ?? {}

  return [
    ...direct,
    ...(memoryBuckets.short_term ?? []),
    ...(memoryBuckets.long_term ?? []),
    ...(memoryBuckets.episodic ?? []),
  ]
}

function buildCallOpenClaw(config) {
  return async function callOpenClaw(payload) {
    const endpoint = new URL(config.openclawInvokePath, config.openclawBaseUrl).toString()
    const headers = {
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
      return JSON.parse(raw)
    }
    catch (error) {
      throw new Error(`OpenClaw response parse failed: ${error}. body=${raw.slice(0, 2000)}`)
    }
  }
}

export function createOpenClawAdapter({ client, config }) {
  const callOpenClaw = buildCallOpenClaw(config)

  async function sendChatReply(input) {
    const assistantMessage = {
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
        [GEN_AI_CHAT_KEY]: {
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
    })
  }

  function sendSparkCommands(sourceEventId, commands) {
    for (const command of commands) {
      const destinations = (command.destinations && command.destinations.length)
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

  function sendContextUpdates(updates = []) {
    const normalized = updates
      .map(normalizeContextUpdate)
      .map(update => ({
        ...update,
        metadata: {
          ...(update.metadata ?? {}),
          source: 'openclaw-bridge',
        },
      }))

    for (const update of normalized)
      client.send({ type: 'context:update', data: update })
  }

  async function handleInputText(event) {
    if (!config.enableAgent)
      return

    const incomingContext = event.data.contextUpdates
    const overrideContextText = normalizeContextText(incomingContext ?? [], config.contextTopK)
    const req = {
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
        metadata: event.metadata,
      },
      capabilities: {
        memory: config.enableMemory,
        agent: config.enableAgent,
      },
    }

    let result
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
    if (reply) {
      sendChatReply({
        sourceText: event.data.text,
        sourceSessionId: event.data.overrides?.sessionId,
        replyText: reply,
        composed: [{ role: 'assistant', content: reply }],
        metadata: event.metadata,
      })
    }

    sendSparkCommands(event.metadata?.event?.id ?? randomId('evt'), result.commands ?? [])
    sendContextUpdates(parseContextUpdates(result))
  }

  async function handleSparkNotify(event) {
    if (!config.enableAgent)
      return

    const prompt = `${event.data.headline}\n${event.data.note ?? ''}`

    const req = {
      source: 'spark:notify',
      eventId: event.data.id,
      correlationId: event.metadata?.event?.id,
      sessionId: event.data.payload?.sessionId,
      prompt,
      text: prompt,
      rawText: prompt,
      context: {
        overrideContextText: event.data.note ?? '',
        overrides: event.data.payload,
        metadata: event.metadata,
      },
      capabilities: {
        memory: config.enableMemory,
        agent: config.enableAgent,
      },
    }

    let result
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
    if (reply) {
      sendChatReply({
        sourceText: prompt,
        sourceSessionId: event.data.payload?.sessionId,
        replyText: reply,
        composed: [{ role: 'assistant', content: reply }],
        metadata: event.metadata,
      })
    }

    sendSparkCommands(event.data.id, result.commands ?? [])
    sendContextUpdates(parseContextUpdates(result))
  }

  async function handleModuleAuthenticated() {
    client.send({
      type: 'module:authenticated',
      data: {
        id: 'openclaw-bridge',
        plugin: {
          id: 'openclaw-bridge',
          name: 'OpenClaw Bridge',
        },
      },
    })
  }

  return {
    initialize() {
      client.on('input:text', handleInputText)
      client.on('spark:notify', handleSparkNotify)
      client.on('module:authenticate', handleModuleAuthenticated)
    },
  }
}

export const openclawBridgeDefaults = {
  wsUrl: 'ws://localhost:6121/ws',
  openclawBaseUrl: 'http://127.0.0.1:8123',
  openclawInvokePath: '/v1/mira/invoke',
  enableMemory: envBool(undefined, true),
  enableAgent: envBool(undefined, true),
  contextTopK: envNumber(undefined, 8),
}
