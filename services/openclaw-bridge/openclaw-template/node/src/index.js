import express from 'express'
import bodyParser from 'body-parser'

const app = express()
const PORT = Number(process.env.PORT || 8000)

app.use(bodyParser.json({ limit: '1mb' }))

/**
 * Environment toggles:
 * - OPENCLAW_UPSTREAM_URL: optional real openclaw service url
 *   e.g. http://127.0.0.1:8080
 * - OPENCLAW_UPSTREAM_PATH: endpoint path, default /v1/airi/invoke
 * - OPENCLAW_UPSTREAM_API_KEY: optional Bearer token
 * - OPENCLAW_CONTEXT_TOP_K: used for quick summaries in fallback mode
 */

const UPSTREAM_URL = process.env.OPENCLAW_UPSTREAM_URL
const UPSTREAM_PATH = process.env.OPENCLAW_UPSTREAM_PATH || '/v1/airi/invoke'
const UPSTREAM_API_KEY = process.env.OPENCLAW_UPSTREAM_API_KEY
const FALLBACK_TOP_K = Number(process.env.OPENCLAW_CONTEXT_TOP_K || 8)

function normalizeArrayTextFromUpdates(updates = []) {
  if (!Array.isArray(updates))
    return []

  return updates
    .map(item => (typeof item === 'string' ? item : item?.text))
    .filter(Boolean)
}

function normalizeResponse(raw = {}) {
  const r = raw || {}

  const text = pickBestText(r)
  const commands = Array.isArray(r.commands) ? r.commands : []
  const directUpdates = [...(Array.isArray(r.contextUpdates) ? r.contextUpdates : []), ...(Array.isArray(r.context_updates) ? r.context_updates : [])]
  const memory = r.memory || {}

  const memoryUpdates = [
    ...(Array.isArray(memory.short_term) ? memory.short_term : []),
    ...(Array.isArray(memory.long_term) ? memory.long_term : []),
    ...(Array.isArray(memory.episodic) ? memory.episodic : []),
  ]

  return {
    ok: typeof r.ok === 'boolean' ? r.ok : true,
    message: text,
    commands,
    contextUpdates: [...directUpdates, ...memoryUpdates],
    context_updates: [...directUpdates, ...memoryUpdates],
    memory: {
      short_term: memory.short_term || [],
      long_term: memory.long_term || [],
      episodic: memory.episodic || [],
    },
    meta: {
      source: 'openclaw-template-node-v2',
      upstreamUsed: Boolean(UPSTREAM_URL),
    },
  }
}

function pickBestText(raw = {}) {
  if (typeof raw.message === 'string' && raw.message.trim())
    return raw.message
  if (typeof raw.reply === 'string' && raw.reply.trim())
    return raw.reply
  if (typeof raw.output === 'string')
    return raw.output
  if (raw.output && typeof raw.output.content === 'string')
    return raw.output.content
  if (raw.output && typeof raw.output.message === 'string')
    return raw.output.message

  return 'OK，已接收。\n'
}

function buildFallbackReply(payload) {
  const {
    source = 'unknown',
    prompt = '',
    text = '',
    eventId,
    sessionId,
    context = {},
    capabilities = {},
  } = payload

  const content = prompt || text || ''
  const contextText = normalizeArrayTextFromUpdates(context?.contextUpdates)
    .slice(-FALLBACK_TOP_K)
    .join('\n')

  const reply = `已接收 ${source} 事件（eventId=${eventId || 'n/a'}）。${content || '空内容'}${contextText ? ` | 上下文片段：${contextText.slice(0, 180)}` : ''}`

  const commands = []
  if (/\b(remind|reminder|提醒|schedule|计划)\b/i.test(content)) {
    commands.push({
      destinations: ['character'],
      intent: 'action',
      priority: 'normal',
      ack: '收到提醒/计划需求，已转交任务子代理',
      guidance: {
        type: 'proposal',
        options: [
          {
            label: '执行提醒任务链路',
            steps: ['解析用户需求', '确认时间/对象', '写入任务槽位'],
            rationale: '用户文本中出现提醒/计划关键词',
            possibleOutcome: ['进入任务执行队列'],
            risk: 'low',
            fallback: ['请求更多确认信息'],
            triggers: ['提醒意图识别成功'],
          },
        ],
      },
    })
  }

  const updates = []
  if (capabilities?.memory) {
    if ((sessionId || content)) {
      updates.push({
        id: `st-${Date.now()}`,
        contextId: `ctx-${Date.now()}`,
        lane: 'memory.short_term',
        strategy: 'append-self',
        text: `session=${sessionId}: latest_input=${content.slice(0, 120) || 'empty'}`,
        content: content,
        destinations: ['character'],
        metadata: {
          memoryType: 'short_term',
          source: 'openclaw-template-node-fallback',
        },
      })
    }

    if (/\b(用户画像|偏好|长期|规则|关系)\b/.test(content)) {
      updates.push({
        id: `lt-${Date.now()}`,
        contextId: `ctx-${Date.now()}`,
        lane: 'memory.long_term',
        strategy: 'append-self',
        text: `session=${sessionId}: 长期偏好片段 ${content.slice(0, 120)}`,
        content: content,
        destinations: ['character'],
        metadata: {
          memoryType: 'long_term',
          source: 'openclaw-template-node-fallback',
        },
      })
    }
  }

  return {
    ok: true,
    message: reply,
    commands,
    contextUpdates: updates,
    memory: {
      short_term: updates.filter(i => i.lane === 'memory.short_term'),
      long_term: updates.filter(i => i.lane === 'memory.long_term'),
      episodic: [],
    },
    meta: {
      source: 'openclaw-template-node-fallback',
      eventId,
      sessionId,
    },
  }
}

async function callUpstreamOpenClaw(body) {
  const endpoint = new URL(UPSTREAM_PATH, UPSTREAM_URL).toString()

  const headers = {
    'content-type': 'application/json',
  }

  if (UPSTREAM_API_KEY)
    headers.Authorization = `Bearer ${UPSTREAM_API_KEY}`

  const upstreamResp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!upstreamResp.ok) {
    const text = await upstreamResp.text()
    throw new Error(`Upstream OpenClaw error: ${upstreamResp.status} ${upstreamResp.statusText}. body=${text}`)
  }

  const raw = await upstreamResp.json()
  return normalizeResponse(raw)
}

app.post('/v1/airi/invoke', async (req, res) => {
  const payload = req.body || {}

  try {
    let response
    if (UPSTREAM_URL) {
      try {
        response = await callUpstreamOpenClaw(payload)
      }
      catch (error) {
        response = normalizeResponse({
          ok: false,
          message: `上游 OpenClaw 调用失败，已自动降级：${error instanceof Error ? error.message : String(error)}`,
          contextUpdates: [],
          memory: {},
        })
      }
    }
    else {
      response = normalizeResponse(buildFallbackReply(payload))
    }

    return res.json(response)
  }
  catch (error) {
    return res.status(500).json({
      ok: false,
      message: `服务异常：${error instanceof Error ? error.message : String(error)}`,
      commands: [],
      contextUpdates: [],
      context_updates: [],
      memory: {
        short_term: [],
        long_term: [],
        episodic: [],
      },
    })
  }
})

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'openclaw-airi-template-node',
    upstream: Boolean(UPSTREAM_URL),
    upstreamUrl: UPSTREAM_URL || null,
  })
})

app.listen(PORT, () => {
  console.log(`[openclaw-template-node] listening on :${PORT}`)
  console.log(`[openclaw-template-node] endpoint: POST /v1/airi/invoke`)
  if (UPSTREAM_URL)
    console.log(`[openclaw-template-node] upstream -> ${new URL(UPSTREAM_PATH, UPSTREAM_URL).toString()}`)
  else
    console.log('[openclaw-template-node] fallback demo mode enabled, set OPENCLAW_UPSTREAM_URL to use real OpenClaw')
})
