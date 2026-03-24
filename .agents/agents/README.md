# Mira Sub-Agents

This directory contains the recommended five-agent split for the Mira monorepo.

Use one primary agent per task. Add a support agent only when the change crosses a hard code ownership boundary.

Start every non-trivial task with `.agents/agents/task-dispatch-template.md`. If the task is opened through GitHub issues, use `.github/ISSUE_TEMPLATE/sub_agent_dispatch.yaml`.

## Agent Map

### 1. Mira Stage Experience

- Owns renderer UX and shared stage behavior.
- Primary paths:
  - `apps/stage-web/src/**`
  - `apps/stage-pocket/src/**`
  - `apps/stage-tamagotchi/src/renderer/**`
  - `packages/stage-pages/**`
  - `packages/stage-ui/**`
  - `packages/stage-ui-live2d/**`
  - `packages/stage-ui-three/**`
  - `packages/stage-shared/**`
  - `packages/ui/**`
- Pull in support from:
  - Docs and Localization for new translation keys or copy review.
  - Platform Shells when renderer work depends on new preload or native shell behavior.

### 2. Mira Platform Shells

- Owns Electron, mobile shell, packaging, and editor shell surfaces.
- Primary paths:
  - `apps/stage-tamagotchi/src/main/**`
  - `apps/stage-tamagotchi/src/preload/**`
  - `apps/stage-tamagotchi/electron*`
  - `apps/stage-pocket/android/**`
  - `apps/stage-pocket/ios/**`
  - `apps/stage-pocket/capacitor.config.ts`
  - `integrations/vscode/**`
- Pull in support from:
  - Runtime and Integrations for new Eventa contracts or backend-facing APIs.
  - Build, Quality, and Release for packaging pipeline issues.

### 3. Mira Runtime and Integrations

- Owns runtime contracts, provider plumbing, plugins, bots, and backend surfaces.
- Primary paths:
  - `apps/server/**`
  - `packages/server-runtime/**`
  - `packages/server-sdk/**`
  - `packages/server-shared/**`
  - `packages/plugin-*`
  - `packages/tauri-plugin-mcp/**`
  - `services/**`
  - `plugins/**`
  - `apps/stage-tamagotchi/src/shared/**`
- Pull in support from:
  - Stage Experience when new runtime capabilities need UI controls.
  - Platform Shells when desktop/mobile shell APIs must expose new runtime behavior.

### 4. Mira Docs and Localization

- Owns docs, translation content, terminology, and contributor-facing documentation.
- Primary paths:
  - `docs/**`
  - `packages/i18n/**`
  - `bucket/**`
  - root/app/package/service `README.md`
- Pull in support from:
  - Stage Experience for UI context behind new strings.
  - Runtime and Integrations for technical accuracy in service or provider docs.

### 5. Mira Build, Quality, and Release

- Owns workspace health, toolchain, CI, release packaging, and dependency graph stability.
- Primary paths:
  - root `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `eslint.config.js`
  - `.github/workflows/**`
  - `patches/**`
  - vendored workspace support packages under `packages/**`
- Pull in support from:
  - Any agent whose code caused a failing quality gate.
  - Platform Shells for Electron/mobile packaging edge cases.

## Routing Rules

- Renderer page or component first: Stage Experience.
- Electron main/preload or native shell first: Platform Shells.
- Server, provider, plugin, bot, or contract first: Runtime and Integrations.
- Docs, locale files, README, or blog assets first: Docs and Localization.
- Lockfile, install failure, CI, lint, typecheck, test, or release failure first: Build, Quality, and Release.

## Handoff Checklist

- Name the primary agent in the task note.
- Name the support agent only when needed.
- List touched ownership boundaries before editing.
- After implementation, run the smallest verification command that proves the boundary still works.
- If a support agent changed files in the primary agent's area, hand the task back for final review before merging.

## Dispatch Workflow

1. Find the entrypoint file or package.
2. Assign the primary agent from the ownership map above.
3. Add support agents only for concrete cross-boundary changes.
4. Fill in the dispatch template before coding.
5. Keep final review with the primary owner unless the task is formally reassigned.
