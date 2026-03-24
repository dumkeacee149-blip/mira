# Project Mira Agent Guide

Concise but detailed reference for contributors working across the `dumkeacee149-blip/mira` monorepo. Improve code when you touch it; avoid one-off patterns.

## Tech Stack (by surface)

- **Desktop (stage-tamagotchi)**: Electron, Vue, Vite, TypeScript, Pinia, VueUse, Eventa (IPC/RPC), UnoCSS, Vitest, ESLint.
- **Web (stage-web)**: Vue 3 + Vue Router, Vite, TypeScript, Pinia, VueUse, UnoCSS, Vitest, ESLint. Backend: WIP.
- **Mobile (stage-pocket)**: Vue 3 + Vue Router, Vite, TypeScript, Pinia, VueUse, UnoCSS, Vitest, ESLint, Kotlin, Swift, Capacitor.
- **UI/Shared Packages**:
  - `packages/stage-ui`: Core business components, composables, stores shared by stage-web & stage-tamagotchi (heart of stage work).
  - `packages/stage-ui-three`: Three.js bindings + Vue components.
  - `packages/stage-ui-pixi`: Planned Pixi bindings.
  - `packages/stage-shared`: Shared logic across stage-ui, stage-ui-three, stage-web, stage-tamagotchi.
  - `packages/ui`: Standardized primitives (inputs, textarea, buttons, layout) built on reka-ui; minimal business logic.
  - `packages/i18n`: Central translations.
  - Server channel: `packages/server-runtime`, `packages/server-sdk`, `packages/server-shared` (power `services/` and `plugins/`).
  - Legacy: `crates/` (old Tauri desktop; current desktop is Electron).

## Structure & Responsibilities

- **Apps**
  - `apps/stage-web`: Web app; composables/stores in `src/composables`, `src/stores`; pages in `src/pages`; devtools in `src/pages/devtools`; router config via `vite.config.ts`.
  - `apps/stage-tamagotchi`: Electron app; renderer pages in `src/renderer/pages`; devtools in `src/renderer/pages/devtools`; settings layout at `src/renderer/layouts/settings.vue`; router config via `electron.vite.config.ts`.
  - Settings/devtools routes rely on `<route lang="yaml"> meta: layout: settings </route>`; ensure routes/icons are registered accordingly (`apps/stage-tamagotchi/src/renderer/layouts/settings.vue`, `apps/stage-web/src/layouts/settings.vue`).
  - Shared page bases: `packages/stage-pages`.
  - Stage pages: `apps/stage-web/src/pages`, `apps/stage-tamagotchi/src/renderer/pages` (plus devtools folders).
- **Stage UI internals** (`packages/stage-ui/src`)
  - Providers: `stores/providers.ts` and `stores/providers/` (standardized provider definitions).
  - Modules: `stores/modules/` (MIRA orchestration building blocks).
  - Composables: `composables/` (business-oriented Vue helpers).
  - Components: `components/`; scenarios in `components/scenarios/` for page/use-case-specific pieces.
  - Stories: `packages/stage-ui/stories`, `packages/stage-ui/histoire.config.ts` (e.g. `components/misc/Button.story.vue`).
- **IPC/Eventa**: Always use `@moeru/eventa` for type-safe, framework/runtime-agnostic IPC/RPC. Define contracts centrally (e.g., `apps/stage-tamagotchi/src/shared`) and follow usage patterns in `apps/stage-tamagotchi/src/main/services/electron` for main/renderer integration.
- **Dependency Injection**: Use `injeca` for services/electron modules/plugins/frontend; see `apps/stage-tamagotchi/src/main/index.ts` for composition patterns.
- **Build/CI/Lint**: `.github/workflows` for pipelines; `eslint.config.js` for lint rules.
- **Bundling libs**: Use `tsdown` for new modules (see `packages/vite-plugin-warpdrive`).
- **Styles**: UnoCSS config at `uno.config.ts`; check `apps/stage-web/src/styles` for existing animations; prefer UnoCSS over Tailwind.

## Key Path Index (what lives where)

- `packages/stage-ui`: Core stage business components/composables/stores.
  - `src/stores/providers.ts` and `src/stores/providers/`: provider definitions (standardized).
  - `src/stores/modules/`: MIRA orchestration modules.
  - `src/composables/`: reusable Vue composables (business-oriented).
  - `src/components/`: business components; `src/components/scenarios/` for page/use-case-specific pieces.
  - Stories: `packages/stage-ui/stories`, `packages/stage-ui/histoire.config.ts` (e.g. `components/misc/Button.story.vue`).
- `packages/stage-ui-three`: Three.js bindings + Vue components.
- `packages/stage-ui-pixi`: Planned Pixi bindings.
- `packages/stage-shared`: Shared logic across stage-ui, stage-ui-three, stage-web, stage-tamagotchi.
- `packages/ui`: Standardized primitives (inputs/textarea/buttons/layout) built on reka-ui.
- `packages/i18n`: All translations.
- Server channel: `packages/server-runtime`, `packages/server-sdk`, `packages/server-shared` (power `services/` and `plugins/`).
- Legacy desktop: `crates/` (old Tauri; Electron is current).
- Pages: `packages/stage-pages` (shared bases); `apps/stage-web/src/pages` and `apps/stage-tamagotchi/src/renderer/pages` for app-specific pages; devtools live in each app’s `.../pages/devtools`.
- Router configs: `apps/stage-web/vite.config.ts`, `apps/stage-tamagotchi/electron.vite.config.ts`.
- Devtools/layouts: `apps/stage-tamagotchi/src/renderer/layouts/settings.vue`, `apps/stage-web/src/layouts/settings.vue`.
- IPC/Eventa contracts/examples: `apps/stage-tamagotchi/src/shared`, `apps/stage-tamagotchi/src/main/services/electron`.
- DI examples: `apps/stage-tamagotchi/src/main/index.ts` (injeca).
- Styles: `uno.config.ts` (UnoCSS), `apps/stage-web/src/styles` (animations/reference).
- Build pipeline refs: `.github/workflows`; lint rules in `eslint.config.js`.
- Tailwind/UnoCSS: prefer UnoCSS; if standardizing styles, add shortcuts/rules/plugins in `uno.config.ts`.
- Bundling pattern: `packages/vite-plugin-warpdrive` (tsdown example).

## Recommended 5-Agent Split

Project Mira is large enough that work should be routed through five stable sub-agents with clear ownership. Keep one primary owner for every task. Pull in a second agent only when the change crosses a hard boundary.

- **1. Stage Experience Agent**
  - Owns renderer UX and shared user-facing stage behavior.
  - Primary scope: `apps/stage-web/src/**`, `apps/stage-pocket/src/**`, `apps/stage-tamagotchi/src/renderer/**`, `packages/stage-pages/**`, `packages/stage-ui/**`, `packages/stage-ui-live2d/**`, `packages/stage-ui-three/**`, `packages/stage-shared/**`, `packages/ui/**`.
  - Typical tasks: routes, settings screens, chat flows, stage widgets, visual interaction, shared composables/stores, component cleanup.
- **2. Platform Shells Agent**
  - Owns platform-specific shells, native wrappers, and app packaging surfaces.
  - Primary scope: `apps/stage-tamagotchi/src/main/**`, `apps/stage-tamagotchi/src/preload/**`, `apps/stage-tamagotchi/electron*`, `apps/stage-pocket/android/**`, `apps/stage-pocket/ios/**`, `apps/stage-pocket/capacitor.config.ts`, `integrations/vscode/**`.
  - Typical tasks: Electron window lifecycle, preload APIs, desktop packaging, mobile shell wiring, Android/iOS identifiers, VS Code extension surfaces.
- **3. Runtime and Integrations Agent**
  - Owns backend/runtime contracts, provider plumbing, services, plugins, and cross-process orchestration.
  - Primary scope: `apps/server/**`, `packages/server-runtime/**`, `packages/server-sdk/**`, `packages/server-shared/**`, `packages/plugin-*`, `packages/tauri-plugin-mcp/**`, `services/**`, `plugins/**`, Eventa contracts in `apps/stage-tamagotchi/src/shared/**`.
  - Typical tasks: provider adapters, Eventa contracts, service orchestration, MCP/plugin runtime, bot integrations, server-side data flow.
- **4. Docs and Localization Agent**
  - Owns docs, translation content, branding copy, blog/media metadata, and contributor-facing documentation.
  - Primary scope: `docs/**`, `packages/i18n/**`, root/app/package/service `README.md`, `bucket/**`.
  - Typical tasks: docs IA, release notes, locale coverage, terminology consistency, migration docs, user-facing copy.
- **5. Build, Quality, and Release Agent**
  - Owns workspace health, dependency graph, CI, linting, test gates, release automation, and repo-wide tooling.
  - Primary scope: root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `eslint.config.js`, `.github/workflows/**`, `patches/**`, repo-wide vendored packages under `packages/**` that exist to satisfy workspace dependency flow.
  - Typical tasks: install/build failures, workspace package registration, lockfile churn, lint/typecheck/test pipelines, release packaging, monorepo tooling.

### Handoff Rules

- UI behavior in renderer pages/components belongs to Agent 1, even when the text changes. If new translation keys are needed, Agent 4 supports.
- Electron main/preload changes belong to Agent 2. If they require new Eventa contracts or service APIs, Agent 3 supports.
- Provider wiring, server contracts, service adapters, and plugins belong to Agent 3, even when a UI screen also needs updates.
- Docs-only, locale-only, and README-only work belongs to Agent 4.
- Any task blocked by workspace config, dependency resolution, CI failures, or release packaging belongs to Agent 5.
- When a task spans multiple areas, assign the agent that owns the entrypoint file as primary and document the support agent in the task note.

### Shared Done Criteria

- Agent 1: user-facing flows remain consistent across desktop/web/mobile where shared code is involved.
- Agent 2: platform boot, IPC surface, and packaging identifiers stay coherent.
- Agent 3: contracts stay typed end-to-end and runtime boundaries remain explicit.
- Agent 4: terminology stays consistent across docs and locales.
- Agent 5: `pnpm install`, `pnpm typecheck`, and repo quality gates remain green or any known exceptions are documented.

See `.agents/agents/README.md` and the five agent definitions in `.agents/agents/*.yaml` for the concrete routing map.

## Task Dispatch Template

Use the Mira task dispatch template for any feature, refactor, bugfix, or cleanup that is bigger than a single isolated file tweak.

- Copy from `.agents/agents/task-dispatch-template.md`.
- If the work is opened on GitHub first, use `.github/ISSUE_TEMPLATE/sub_agent_dispatch.yaml`.
- Always pick the primary agent from the entrypoint file, not from the broad feature label.
- Add support agents only when the change crosses an ownership boundary.

### Dispatch Flow

1. Find the first file or package where the change must begin.
2. Match that entrypoint to one of the five ownership maps above.
3. Mark that owner as the primary agent.
4. Add support agents only for explicit cross-boundary work.
5. Write the smallest verification commands that prove the touched boundary still works.
6. If support agents modify the primary owner's area, route the final review back to the primary agent.

### Required Dispatch Fields

- Request summary
- Primary agent
- Support agents
- Entrypoint path
- Ownership boundaries touched
- Desired outcome
- Non-goals
- Deliverables
- Verification commands
- Handoff notes
- Done criteria

## Commands (pnpm with filters)

> Use pnpm workspace filters to scope tasks. Examples below are generic; replace the filter with the target workspace name (e.g. `@proj-mira/stage-tamagotchi`, `@proj-mira/stage-web`, `@proj-mira/stage-ui`, etc.).

- **Typecheck**
  - `pnpm -F <package.json name> typecheck`
  - Example: `pnpm -F @proj-mira/stage-tamagotchi typecheck` (runs `tsc` + `vue-tsc`).
- **Unit tests (Vitest)**
  - Targeted: `pnpm exec vitest run <path/to/file>`
    e.g. `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/tools/builtin/widgets.test.ts`
  - Workspace: `pnpm -F <package.json name> exec vitest run`
    e.g. `pnpm -F @proj-mira/stage-tamagotchi exec vitest run`
  - Root `pnpm test:run`: runs all tests across registered projects. If no tests are found, check `vitest.config.ts` include patterns.
  - Root `vitest.config.ts` includes `apps/stage-tamagotchi` and other projects; each app/package can have its own `vitest.config`.
- **Lint**
  - `pnpm lint` and `pnpm lint:fix`
  - Formatting is handled via ESLint; `pnpm lint:fix` applies formatting.
- **Build**
  - `pnpm -F <package.json name> build`
  - Example: `pnpm -F @proj-mira/stage-tamagotchi build` (typecheck + electron-vite build).

## Development Practices

- Favor clear module boundaries; shared logic goes in `packages/`.
- Keep runtime entrypoints lean; move heavy logic into services/modules.
- Prefer functional patterns + DI (`injeca`) for testability.
- Use Valibot for schema validation; keep schemas close to their consumers.
- Use Eventa (`@moeru/eventa`) for structured IPC/RPC contracts where needed.
- Use `errorMessageFrom(error)` from `@moeru/std` to extract error messages instead of manual patterns like `error instanceof Error ? error.message : String(error)`. Pair with `?? 'fallback'` when a default is needed.
- Do not add backward-compatibility guards. If extended support is required, write refactor docs and spin up another Codex or Claude Code instance via shell command to complete the implementation with clear instructions and the expected post-refactor shape.
- If the refactor scope is small, do a progressive refactor step by step.
- When modifying code, always check for opportunities to do small, minimal progressive refactors alongside the change.

## Styling & Components

- Prefer Vue v-bind class arrays for readability when working with UnoCSS & tailwindcss: do `:class="['px-2 py-1','flex items-center','bg-white/50 dark:bg-black/50']"`, don't do `class="px-2 py-1 flex items-center bg-white/50 dark:bg-black/50"`, don't do `px="2" py="1" flex="~ items-center" bg="white/50 dark:black/50"`; avoid long inline `class=""`. Refactor legacy when you touch it.
- Use/extend UnoCSS shortcuts/rules in `uno.config.ts`; add new shortcuts/rules/plugins there when standardizing styles. Prefer UnoCSS over Tailwind.
- Check `apps/stage-web/src/styles` for existing animations; reuse or extend before adding new ones. If you need config references, see `apps/stage-web/tsconfig.json` and `uno.config.ts`.
- Build primitives on `@proj-mira/ui` (reka-ui) instead of raw DOM; see `packages/ui/src/components/Form` for patterns.
- Use Iconify icon sets; avoid bespoke SVGs.
- Animations: keep intuitive, lively, and readable.
- `useDark` (VueUse): set `disableTransition: false` or use existing composables in `packages/ui`.

## Testing Practices

- Vitest per project; keep runs targeted for speed.
- Mock IPC/services with `vi.fn`/`vi.mock`; do not rely on real Electron runtime.
- For external providers/services, add both mock-based tests and integration-style tests (with env guards) when feasible. You can mock imports with Vitest.
- Grow component/e2e coverage progressively (Vitest browser env where possible). Use `expect` and assert mock calls/params.

## TypeScript / IPC / Tools

- Keep JSON Schemas provider-compliant (explicit `type: object`, required fields; avoid unbounded records).
- Favor functional patterns + DI (`injeca`); avoid new class hierarchies unless extending browser APIs (classes are harder to mock/test).
- Centralize Eventa contracts; use `@moeru/eventa` for all events.
- When a user asks to use a specific tool or dependency, first check Context7 docs with the search tool, then inspect actual usage of the dependency in this repo.
- If multiple names are returned from Context7 without a clear distinction, ask the user to choose or confirm the desired one.
- If docs conflict with typecheck results, inspect the dependency source under `node_modules` to diagnose root cause and fix types/bugs.

## i18n

- Add/modify translations in `packages/i18n`; avoid scattering i18n across apps/packages.

## CSS/UNO

- Use/extend UnoCSS shortcuts in `uno.config.ts`.
- Prefer grouped class arrays for readability; refactor legacy inline strings when possible.

## Naming & Comments

- File names: kebab-case.
- Avoid classes unless extending runtime/browser APIs; FP + DI is easier to test/mock.
- Add clear, concise comments for utils, math, OS-interaction, algorithm, shared, and architectural functions that explain what the function does.
- When using a workaround, add a `// NOTICE:` comment explaining why, the root cause, and any source context. If validated via `node_modules` inspection or external sources (e.g., GitHub), include relevant line references and links in code-formatted text.
- When moving/refactoring/fixing/updating code, keep existing comments intact and move them with the code. If a comment is truly unnecessary, replace it with a comment stating it previously described X and why it was removed.
- Avoid stubby/hacky scaffolding; prefer small refactors that leave code cleaner.
- Use markers:
  - `// TODO:` follow-ups
  - `// REVIEW:` concerns/needs another eye
  - `// NOTICE:` magic numbers, hacks, important context, external references/links

## PR / Workflow Tips

- Rebase pulls; branch naming `username/feat/short-name`; clear commit messages (gitmoji optional).
- Summarize changes, how tested (commands), and follow-ups.
- Improve legacy you touch; avoid one-off patterns.
- Keep changes scoped; use workspace filters (`pnpm -F <workspace> <script>`).
- Maintain structured `README.md` documentation for each `packages/` and `apps/` entry, covering what it does, how to use it, when to use it, and when not to use it.
- Always run `pnpm typecheck` and `pnpm lint:fix` after finishing a task.
- Use Conventional Commits for commit messages (e.g., `feat: add runner reconnect backoff`).
