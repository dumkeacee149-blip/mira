import process from 'node:process'

import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 8123)
const UPSTREAM_URL = process.env.OPENCLAW_UPSTREAM_URL
const UPSTREAM_PATH = process.env.OPENCLAW_UPSTREAM_PATH || '/v1/airi/invoke'
const UPSTREAM_API_KEY = process.env.OPENCLAW_UPSTREAM_API_KEY
const FALLBACK_TOP_K = Number(process.env.OPENCLAW_CONTEXT_TOP_K || 8)

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024)
        reject(new Error('payload too large'))
    })
    req.on('end', () => {
      if (!body)
        return resolve({})
      try {
        resolve(JSON.parse(body))
      }
      catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function normalizeArrayText(updates) {
  if (!Array.isArray(updates))
    return []

  return updates
    .map(item => (typeof item === 'string' ? item : item?.text))
    .filter(Boolean)
}

function pickBestText(raw = {}) {
  if (typeof raw.message === 'string' && raw.message.trim())
    return raw.message
  if (typeof raw.reply === 'string' && raw.reply.trim())
    return raw.reply
  if (typeof raw.output === 'string')
    return raw.output
  if (typeof raw.output?.content === 'string')
    return raw.output.content
  if (typeof raw.output?.message === 'string')
    return raw.output.message
  return 'OK，已接收。\n'
}

function normalizeResponse(raw = {}) {
  const r = raw || {}
  const directUpdates = [...(Array.isArray(r.contextUpdates) ? r.contextUpdates : []), ...(Array.isArray(r.context_updates) ? r.context_updates : [])]
  const memory = r.memory || {}

  return {
    ok: typeof r.ok === 'boolean' ? r.ok : true,
    message: pickBestText(r),
    commands: Array.isArray(r.commands) ? r.commands : [],
    contextUpdates: [...directUpdates, ...(Array.isArray(memory.short_term) ? memory.short_term : []), ...(Array.isArray(memory.long_term) ? memory.long_term : []), ...(Array.isArray(memory.episodic) ? memory.episodic : [])],
    context_updates: [...directUpdates, ...(Array.isArray(memory.short_term) ? memory.short_term : []), ...(Array.isArray(memory.long_term) ? memory.long_term : []), ...(Array.isArray(memory.episodic) ? memory.episodic : [])],
    memory: {
      short_term: memory.short_term || [],
      long_term: memory.long_term || [],
      episodic: memory.episodic || [],
    },
    meta: {
      source: 'airi-bundled-openclaw-runtime',
      upstreamUsed: Boolean(UPSTREAM_URL),
    },
  }
}

async function callUpstream(payload) {
  const endpoint = new URL(UPSTREAM_PATH, UPSTREAM_URL).toString()
  const headers = {
    'content-type': 'application/json',
  }

  if (UPSTREAM_API_KEY)
    headers.Authorization = `Bearer ${UPSTREAM_API_KEY}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upstream OpenClaw error: ${res.status} ${res.statusText}. body=${text}`)
  }

  return normalizeResponse(await res.json())
}

function buildFallback(payload = {}) {
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
  const contextText = normalizeArrayText(context.contextUpdates)
    .slice(-FALLBACK_TOP_K)
    .join('\n')

  const reply = `已接收 ${source} 事件（eventId=${eventId || 'n/a'}）。${content || '空内容'}${contextText ? ` | 上下文片段：${contextText.slice(0, 180)}` : ''}`

  const updates = []
  if (capabilities?.memory && (sessionId || content)) {
    updates.push({
      id: `st-${Date.now()}`,
      contextId: `ctx-${Date.now()}`,
      lane: 'memory.short_term',
      strategy: 'append-self',
      text: `session=${sessionId}: latest_input=${content.slice(0, 120) || 'empty'}`,
      content,
      destinations: ['character'],
      metadata: {
        memoryType: 'short_term',
        source: 'openclaw-bundled-runtime-fallback',
      },
    })
  }

  return normalizeResponse({
    ok: true,
    message: reply,
    contextUpdates: updates,
    memory: {
      short_term: updates.filter(item => item.lane === 'memory.short_term'),
      long_term: [],
      episodic: [],
    },
    meta: {
      source: 'openclaw-runtime-fallback',
      eventId,
      sessionId,
    },
  })
}

async function handleInvoke(payload, res) {
  if (UPSTREAM_URL) {
    try {
      const upstream = await callUpstream(payload)
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify(upstream))
    }
    catch (error) {
      const fallback = normalizeResponse({
        ok: false,
        message: `上游 OpenClaw 调用失败，已自动降级：${error instanceof Error ? error.message : String(error)}`,
      })
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify(fallback))
    }
  }

  const response = buildFallback(payload)
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  return res.end(JSON.stringify(response))
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    return res.end(JSON.stringify({
      ok: true,
      service: 'airi-bundled-openclaw-runtime',
      upstream: Boolean(UPSTREAM_URL),
      upstreamUrl: UPSTREAM_URL || null,
    }))
  }

  if (req.method === 'POST' && req.url === '/v1/airi/invoke') {
    try {
      const payload = await readBody(req)
      return handleInvoke(payload, res)
    }
    catch (error) {
      res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  return res.end('not found')
})

server.listen(PORT, () => {
  console.info(`[openclaw-runtime] listening on :${PORT}`)
  console.info('[openclaw-runtime] endpoint: POST /v1/airi/invoke')
})
