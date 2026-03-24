# embedded-runtime

此目录放置打包时一并携带的本地运行时文件。

当前打包行为：
- 安装版默认自动启用 `AIRI_RUNTIME_MANAGED=true`
- 自动查找并启动 `embedded-runtime/openclaw-bridge/openclaw-bridge.js`
- 自动查找并启动 `embedded-runtime/openclaw-runtime/openclaw-runtime.js`

目录建议（已按该结构落地）：
- `openclaw-bridge/openclaw-bridge.js`
- `openclaw-bridge/openclaw-adapter.js`
- `openclaw-runtime/openclaw-runtime.js`

运行时加载按以下优先级读取启动命令：
1. 环境变量：`OPENCLAW_BRIDGE_COMMAND` / `OPENCLAW_RUNTIME_COMMAND`
2. 打包目录中的 `embedded-runtime/*/` 脚本（按 .exe/.mjs/.js/.js 查找）

默认健康检查与连接地址：
- `openclaw-bridge` -> `http://127.0.0.1:8123/health`
- `openclaw-runtime` -> `http://127.0.0.1:8123/health`
- ws: `ws://127.0.0.1:6121/ws`

默认 `openclaw-bridge` 会把能力请求打到内置 runtime：
- `OPENCLAW_BASE_URL=http://127.0.0.1:8123`
- `OPENCLAW_INVOKE_PATH=/v1/airi/invoke`

如果用户配置了外部 OpenClaw 地址，可通过
- `OPENCLAW_UPSTREAM_URL`
- `OPENCLAW_UPSTREAM_API_KEY`
- `OPENCLAW_UPSTREAM_PATH`

覆盖并接管模板能力。
