# Mira Task Dispatch Template

Use this template when a task is large enough to need ownership clarity before implementation.

## Copy-Paste Template

```md
# Mira Task Dispatch

## Intake
- Request summary:
- Priority:
- Primary agent:
- Support agents:
- Entrypoint path:
- Ownership boundaries touched:

## Outcome
- Desired outcome:
- Non-goals:

## Execution
- Deliverables:
- Risks or dependencies:
- Verification commands:
- Handoff notes:

## Done When
- [ ] The primary boundary is implemented cleanly
- [ ] Cross-boundary changes are reviewed by the right support agent
- [ ] Verification commands pass or known exceptions are documented
- [ ] The final review goes back to the primary agent when ownership overlaps
```

## Quick Routing Rules

- Renderer page, route, stage widget, shared UI store, or interaction flow: `Mira Stage Experience`
- Electron main, preload, desktop packaging, mobile native shell, or VS Code shell surface: `Mira Platform Shells`
- Service, plugin, provider adapter, MCP wiring, contract, bot, or runtime orchestration: `Mira Runtime and Integrations`
- Docs, README, locale strings, terminology, migration notes, or branded copy: `Mira Docs and Localization`
- Workspace config, lockfile, CI, typecheck, lint, tests, release flow, or vendored dependency support: `Mira Build, Quality, and Release`

## Example Dispatches

### Example 1

```md
# Mira Task Dispatch

## Intake
- Request summary: Add a new speech-provider settings panel in desktop and web
- Priority: High
- Primary agent: Mira Stage Experience
- Support agents: Mira Runtime and Integrations, Mira Docs and Localization
- Entrypoint path: packages/stage-ui/src/components/scenarios/dialogs/onboarding/
- Ownership boundaries touched: stage-ui, server provider contracts, packages/i18n

## Outcome
- Desired outcome: Users can configure the provider from shared UI without breaking existing onboarding flow
- Non-goals: Rewriting unrelated onboarding steps or changing provider runtime semantics

## Execution
- Deliverables: shared settings UI, provider contract additions, locale keys
- Risks or dependencies: provider capability mismatch between UI and runtime
- Verification commands: pnpm typecheck; pnpm -F @proj-mira/stage-ui exec vitest run
- Handoff notes: Runtime agent reviews contract shape, Docs agent reviews new copy

## Done When
- [ ] Shared onboarding flow works in all stage surfaces using the shared package
- [ ] New strings exist in packages/i18n
- [ ] Provider contract remains typed end-to-end
```

### Example 2

```md
# Mira Task Dispatch

## Intake
- Request summary: Fix Windows auto-update restart failure in the Electron app
- Priority: High
- Primary agent: Mira Platform Shells
- Support agents: Mira Build, Quality, and Release
- Entrypoint path: apps/stage-tamagotchi/src/main/
- Ownership boundaries touched: electron main, packaging, release pipeline

## Outcome
- Desired outcome: Desktop update flow restarts reliably after install
- Non-goals: Refactoring renderer UI or changing unrelated updater copy

## Execution
- Deliverables: main-process fix, packaging adjustment, release verification notes
- Risks or dependencies: updater behavior differs between local and packaged builds
- Verification commands: pnpm typecheck; pnpm -F @proj-mira/stage-tamagotchi build
- Handoff notes: Build agent validates packaging and release assumptions

## Done When
- [ ] Electron main flow handles restart consistently
- [ ] Packaging or CI expectations are documented
- [ ] Final review remains with Platform Shells
```
