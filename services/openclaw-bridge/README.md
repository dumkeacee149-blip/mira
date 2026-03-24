# OpenClaw Bridge for AIRI

这个服务把 OpenClaw 能力作为 AIRI 的**内置能力端口**接入，不需要改动 AIRI 核心。

## 作用
- 监听 AIRI 事件：
  - `input:text`
  - `spark:notify`
- 调用 OpenClaw HTTP 能力接口
- 把结果回灌到 AIRI 事件总线：
  - `output:gen-ai:chat:message`
  - `spark:command`
  - `context:update`

## 快速启动
1. 进入目录：`cd services/openclaw-bridge`
2. 复制 `.env.example` 为 `.env`
3. 修改
   - `OPENCLAW_AIRI_WS_URL`
   - `OPENCLAW_BASE_URL`
   - `OPENCLAW_INVOKE_PATH`
   - `OPENCLAW_API_KEY`（如有）
4. 启动：

```bash
pnpm start
```

> 注意：当前环境里 `pnpm` 是否可用依赖你的机器；若不可用，请改用你本机常用包管理器执行等价命令。

5. 如果你还没 OpenClaw 服务，先启动模板之一：
- Node 版：`services/openclaw-bridge/openclaw-template/node`
- Python 版：`services/openclaw-bridge/openclaw-template/python`
- 两者都可监听 `POST /v1/airi/invoke`（默认 `http://localhost:8000`）

模板启动说明与代码见：`services/openclaw-bridge/openclaw-template/README.md`

## 一键联动启动清单（最小）
- 终端 1：启动 AIRI（你的既有方式）
- 终端 2：启动 OpenClaw 服务（你现有 openclaw 启动方式）
- 终端 3：启动 bridge：

```bash
cd services/openclaw-bridge && pnpm start
```

## 上下文关联与记忆策略（当前版本内置）
- 默认会把 `input:text` 的 `contextUpdates` 合并为 `overrideContextText` 回传 OpenClaw，用于上下文检索联动。
- OpenClaw 返回时，如果返回以下字段，会自动转换为 AIRI 的 `context:update`：
  - `contextUpdates`
  - `context_updates`
  - `memory.short_term`
  - `memory.long_term`
  - `memory.episodic`
- 你只要在 OpenClaw 返回中返回 `memoryType: short_term/long_term/episodic`，bridge 会自动写入对应 lane（仅元数据层面分类）：
  - `memory.short_term`
  - `memory.long_term`
  - `memory.episodic`

## OpenClaw 返回约定（建议）
返回 JSON 可包含：

```json
{
  "message": "对用户的最终回复",
  "commands": [
    {
      "destinations": ["character"],
      "intent": "action",
      "priority": "normal",
      "ack": "确认执行",
      "guidance": {
        "type": "proposal",
        "persona": null,
        "options": []
      }
    }
  ],
  "contextUpdates": [
    {
      "text": "对话记忆片段",
      "strategy": "append-self",
      "destinations": ["character"],
      "metadata": {
        "memoryType": "short_term",
        "importance": 0.8
      }
    }
  ]
}
```

兼容额外字段：
- `reply`
- `output.message` / `output.content`
- `context_updates`
- `memory.short_term` `memory.long_term` `memory.episodic`
