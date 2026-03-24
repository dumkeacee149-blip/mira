# OpenClaw 能力模板（MIRA Bridge 对接）

该目录提供两套最小可用 API 服务模板（Node + Python），用于立即对接 `services/openclaw-bridge`。

> 目标接口：`POST /v1/mira/invoke`

两套都按同一请求/返回约定：
- 输入：
  - `source`: `input:text` | `spark:notify`
  - `prompt` / `text`
  - `sessionId`
  - `context`（可含 `contextUpdates`, `overrideContextText`）
  - `capabilities`: `{ memory, agent }`
- 返回（可兼容）：
  - `message` / `reply` / `output.message` / `output.content`
  - `commands`
  - `contextUpdates` / `context_updates`
  - `memory.{short_term,long_term,episodic}`

## 1) Node 模板

```bash
cd services/openclaw-bridge/openclaw-template/node
npm install
npm start
```

服务监听：`http://localhost:8000/v1/mira/invoke`

### 真实 OpenClaw 直连（可选）
设置环境变量：
- `OPENCLAW_UPSTREAM_URL`（如 `http://127.0.0.1:3000`）
- `OPENCLAW_UPSTREAM_PATH`（默认 `/v1/mira/invoke`）
- `OPENCLAW_UPSTREAM_API_KEY`（如有）

若配置了 `OPENCLAW_UPSTREAM_URL`，模板将透传到真实 OpenClaw；失败时自动降级为演示逻辑。

- `node/package.json` 已内置 `express`

## 2) Python 模板

```bash
cd services/openclaw-bridge/openclaw-template/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 真实 OpenClaw 直连（可选）
设置环境变量：
- `OPENCLAW_UPSTREAM_URL`
- `OPENCLAW_UPSTREAM_PATH`
- `OPENCLAW_UPSTREAM_API_KEY`

若配置了 `OPENCLAW_UPSTREAM_URL`，模板将透传到真实 OpenClaw；失败时自动降级为演示逻辑。

服务监听：`http://localhost:8000/v1/mira/invoke`

## 与 MIRA Bridge 的最小匹配
- `services/openclaw-bridge/src/adapter.ts` 已支持以下 OpenClaw 响应字段兼容：
  - `message`, `reply`, `output.message`, `output.content`
  - `contextUpdates`, `context_updates`, `memory.*`
- 将返回 `memoryType` 映射到 context lane：
  - `short_term`、`long_term`、`episodic`

## 一条示例上下文响应

```json
{
  "message": "已处理，已记录到记忆",
  "commands": [],
  "memory": {
    "short_term": [
      {
        "text": "用户要我关注价格",
        "strategy": "append-self",
        "destinations": ["character"],
        "metadata": { "memoryType": "short_term" }
      }
    ],
    "long_term": [],
    "episodic": []
  }
}
```