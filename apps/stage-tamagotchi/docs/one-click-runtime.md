# MiRa 一键安装运行时方案（阶段实现）

目标：用户安装 `.exe` 后，不需要手工启动 OpenClaw / Bridge，即可体验基础聊天。

## 已实现（当前版本）

1. **Onboarding 增加流程**
   - 语言选择（中文/英文）
   - LLM 提供商配置
   - 语音能力可选：可先跳过

2. **主进程新增本地服务编排器（本地runtime启动器）**
   - 文件：`apps/stage-tamagotchi/src/main/services/local-runtime.ts`
   - 特性：
     - 自动读取环境变量启动 OpenClaw 相关进程
     - 服务健康检查
     - 退出时清理进程

## 给最终用户的打包约定（下一步配合安装器生效）

### 打包产物约定（已补齐）

- 打包会额外携带 `apps/stage-tamagotchi/embedded-runtime/**` 到安装产物为 `resources/embedded-runtime`。
- `MiRa` 启动后默认从安装目录自动尝试读取以下优先级命令：
  - 首先读取 `OPENCLAW_*` 环境变量
  - 再读取 `resources/embedded-runtime/openclaw-bridge` 与 `resources/embedded-runtime/openclaw-runtime`

---

### 原有约定


### 环境变量约定

- `MiRa_RUNTIME_MANAGED`
  - `true`（默认）为开启；`false` 关闭
- `OPENCLAW_BRIDGE_COMMAND`
  - 例如：`node /path/to/openclaw-bridge/dist/index.js`
  - 或开发期：`node /path/to/openclaw-bridge/src/index.ts`（需要 tsx 支持）
- `OPENCLAW_RUNTIME_COMMAND`
  - 指向 OpenClaw 实际服务启动命令（可选）
- `OPENCLAW_BRIDGE_HEALTH_URL`
  - 默认：`http://127.0.0.1:8000/health`
- `OPENCLAW_RUNTIME_HEALTH_URL`
  - 可选，如设置则进行健康检查

### 开发到发布的建议

1. **打包前先把运行时组件内置为可执行文件/脚本**
   - OpenClaw 本体建议封装为 `openclaw-runtime` 可执行文件（或固定 Node 启动脚本）
   - OpenClaw Bridge 建议封装为 `openclaw-bridge.exe / .sh`
2. **Installer 生成阶段注入环境变量**
   - 自动写入上述路径到用户可执行程序环境
   - 端口和URL默认走本机 `127.0.0.1`
3. **首启时服务自检页**
   - 若 bridge/runtime 未就绪，给“重试”和“跳过语音”的友好选项
4. **失败兜底**
   - 无法启动时仍可进入文本聊天体验
   - 提示用户补齐 API Key 后点“重试服务”

## 下一步（你可直接要求我继续）

- 为 main window 增加“启动状态面板”
- 为设置页补一个“服务诊断 + 一键重试”入口
- 将 `apps/stage-tamagotchi/src/main/services/local-runtime.ts` 与安装器打包钩子打通（NSIS / dmg / installer）

### 打包命令（示例）

在 `apps/stage-tamagotchi` 下运行：

```bash
pnpm run build:win
pnpm run build:mac
```

一条命令同时打 Windows + mac 安装包：

```bash
pnpm run build:desktop
```

仓库根目录也提供聚合命令：

```bash
pnpm run build:tamagotchi:installers
```

或输出便携版：

```bash
pnpm run build:unpack
```

> `extraResources` 会将 `embedded-runtime` 目录打进 `resources/embedded-runtime`，
> 应用启动时会优先使用 `OPENCLAW_*_COMMAND`，若未设置则自动回退到该目录。
