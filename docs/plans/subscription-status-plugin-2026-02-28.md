# Subscription Status Plugin

**Status**: Complete
**Created**: 2026-02-28
**Updated**: 2026-02-28

## Summary

Build an OpenCode plugin showing subscription usage status for ChatGPT/Codex, Z.AI, and Kimi with a provider abstraction layer, compact UI bars, and model-aware output.

## Context

- **Why**: Users need visibility into subscription quota without leaving OpenCode
- **Constraints**: V1 scope limited to 3 providers, no persistent TUI status widget (requires upstream API)
- **Architecture**: Plugin → Interface → Implementation pattern
- **Related**: PLAN.md at project root, docs/ folder

## Key Files

- `src/interfaces/types.ts` — Domain types (QuotaSnapshot, QuotaWindow, etc.)
- `src/interfaces/provider.ts` — StatusProvider interface (contract)
- `src/providers/chatgpt-codex.ts` — OpenAI implementation
- `src/providers/zai-coding-plan.ts` — Z.AI implementation
- `src/providers/kimi.ts` — Kimi implementation
- `src/client.ts` — Unified interface using providers
- `src/core/cache.ts` — Privacy-aware TTL cache
- `src/core/thresholds.ts` — Crossing detection
- `src/core/reactivity.ts` — Refresh orchestration
- `src/ui/bar.ts` — Text bar renderer (pure function)
- `src/ui/theme.ts` — Theme colors
- `src/plugin.ts` — OpenCode plugin entry
- `src/commands/status.ts` — `/status` command
- `src/tools/status.ts` — Tool handler
- `docs/` — Full documentation
- `fixtures/` — Mock data for testing

## Architecture

```
Plugin (src/plugin.ts)
    ↓
Client (src/client.ts) — Unified interface: getStatus(providerId, modelId?)
    ↓
Interface (src/interfaces/provider.ts) — StatusProvider contract
    ↓
Implementations (src/providers/*) — ChatGPT, Z.AI, Kimi
```

- **Plugin → Interface → Implementation**: Clean dependency direction
- **Unified Interface**: `getStatus(providerId, modelId?)` returns `QuotaSnapshot`
- **Rendering is separate**: Pure function that takes `QuotaSnapshot`
- **Privacy-first**: Cache stores only quota metadata, never conversation content

## Tasks

- [x] Task 1: Project Foundation
- [x] Task 2: Core Types
- [x] Task 3: StatusProvider Interface
- [x] Task 4: UI Text Bar Renderer
- [x] Task 5: Storage Cache
- [x] Task 6: Threshold Detector
- [x] Task 7: ChatGPT/Codex Provider
- [x] Task 8: Z.AI Provider
- [x] Task 9: Kimi Provider
- [x] Task 10: Client
- [x] Task 11: Reactivity Scheduler
- [x] Task 12: Status Tool & Command
- [x] Task 13: Mock Fixtures
- [x] Task 14: Unit Tests
- [x] Task 15: Documentation
- [x] Task 16: Review Fixes (header wiring, API contract, privacy, runtime tests)

## Test Coverage

| Category    | Tests  | Location           |
| ----------- | ------ | ------------------ |
| Unit        | 40     | tests/unit/        |
| Integration | 15     | tests/integration/ |
| E2E         | 5      | tests/e2e/         |
| **Total**   | **60** |                    |

## Documentation

| Document             | Description              |
| -------------------- | ------------------------ |
| docs/README.md       | Overview and quick start |
| docs/API.md          | Complete API reference   |
| docs/ARCHITECTURE.md | System design            |
| docs/PRIVACY.md      | Privacy policy           |

## Decisions Log

- 2026-02-28: Decomposed into 14 tasks, sequential execution
- 2026-02-28: Renamed adapter → provider, added interface layer
- 2026-02-28: Added /status command for detailed output
- 2026-02-28: Added theme support
- 2026-02-28: Wired header extraction into client lifecycle
- 2026-02-28: Fixed plugin API contract using tool() helper from @opencode-ai/plugin/tool
- 2026-02-28: Added privacy documentation to cache module
- 2026-02-28: Added runtime integration tests for header updates
- 2026-02-28: Created comprehensive documentation suite

## Notes

- Providers are structurally similar — patterns are reusable
- Cache is privacy-aware: only quota metadata stored
- Plugin uses proper OpenCode tool() helper for type safety
