# OpenCode Subscription Status Plugin Plan

## Objective

Build an OpenCode plugin that shows usage status in a native-feeling way for ChatGPT/Codex, Z.AI Coding Plan, and Kimi, using a provider abstraction layer and selected-model-aware output when supported.

The UI should be non-intrusive, subtle, clean, and professional, matching OpenCode's design language and feeling premium.

## Scope (V1)

- Reuse OpenCode auth from `~/.local/share/opencode/auth.json` when available.
- Implement a provider adapter interface.
- Ship adapters for:
  - ChatGPT/Codex (`openai` auth and usage endpoints)
  - Z.AI Coding Plan (`zai-coding-plan`)
  - Kimi (`kimi-for-coding` / Moonshot-compatible config)
- Render premium, compact usage bars (`5h`, `weekly`, or provider-equivalent windows).
- Show selected model usage context when provider data supports model-level usage.
- Surface status through plugin-supported UI paths (tool output, command output, and toast alerts).
- Cache aggressively and refresh pragmatically based on user activity and TTLs.

## Out of Scope (V1)

- Persistent always-visible footer/status widget in OpenCode TUI (requires core API extension).
- Providers beyond ChatGPT/Codex, Z.AI, and Kimi in V1.
- Separate plugin-managed OAuth flow.

## Architecture

1. `core/types`
   - Normalized types: `QuotaSnapshot`, `QuotaWindow`, `QuotaCredit`, `ProviderStatusAdapter`.
   - Include optional model-scoped fields: `selectedModelId`, `selectedModelUsage`.
   - Include provider capability flags: `supportsModelScopedUsage`, `supportsHardLimits`, `supportsCostOnly`.
2. `adapters/base`
   - Adapter contract and registration.
3. `adapters/chatgpt-codex`
   - Auth loading from OpenCode auth file.
   - Usage endpoint fetch.
   - Snapshot normalization (`5h`, `weekly`, reset times, percentages).
4. `adapters/zai-coding-plan`
   - Auth loading from OpenCode auth file.
   - Usage fetch if endpoint exists; fallback to inferred usage from session/tool/message stats.
   - Normalize to provider windows or inferred rolling usage.
5. `adapters/kimi`
   - Auth loading from OpenCode auth file/config.
   - Moonshot/Kimi usage fetch if endpoint exists; fallback to inferred usage.
   - Normalize to provider windows or inferred rolling usage.
6. `core/storage`
   - Snapshot cache and last-notified threshold state.
   - Cache keys by `provider + account + selectedModelId` (where available).
   - Stale-while-revalidate behavior for fast reads.
7. `core/thresholds`
   - Crossing detection with anti-spam logic.
8. `ui/render`
   - Text bar renderer to mimic Codex style (`[████░░░░]`).
   - Theme-safe output with low visual noise and compact spacing.
   - Responsive formatting profiles for normal and small window mode.
9. `tools/status`
   - Tool/command handler returning concise usage bars.
   - Prefer selected-model view when available; otherwise show account-level usage with clear fallback note.
10. `core/reactivity`
   - Pragmatic refresh scheduler (event-driven + TTL fallback).
   - Debounced updates after model/session changes and after completed requests.

## UX and Visual Direction

- Non-intrusive by default: no noisy animations, no heavy separators, no visual clutter.
- Premium tone: restrained spacing, aligned columns, concise copy, and consistent labels.
- Subtle emphasis: only highlight risk states (low/exhausted) with minimal toast frequency.
- Professional behavior: deterministic updates, predictable placement, and clean fallbacks.

## UI Mocks (text)

### Preferred (when host supports right-panel injection)

```text
Usage
Model   gpt-5.3-codex
5h      [████████████░░░░░░░░] 58%  reset 14:20
Weekly  [███████████░░░░░░░░░] 52%  reset Tue 09:00
```

```text
Usage
Model   glm-5 (Z.AI)
Window  [████████████████░░░░] 80%  reset 02:10
```

### Fallback (current plugin APIs, command/tool output)

```text
usage: gpt-5.3-codex
5h     [████████████░░░░░░░░] 58% left  (resets 14:20)
week   [███████████░░░░░░░░░] 52% left  (resets Tue 09:00)
```

### Small window mode

```text
gpt-5.3-codex  5h [██████░░] 58%  wk [█████░░░] 52%
```

```text
glm-5 (zai)  [███████░] 80%  reset 02:10
```

## Mock Data Fixtures (for tests and development)

- `fixtures/openai/usage-ok.json` (`5h`, `weekly`, reset timestamps)
- `fixtures/openai/usage-exhausted.json` (0% and exhausted transitions)
- `fixtures/zai/usage-ok.json` (provider-specific shape)
- `fixtures/kimi/usage-ok.json` (provider-specific shape)
- `fixtures/common/no-model-scope.json` (account-level only)
- `fixtures/common/api-error-429.json`, `fixtures/common/api-error-500.json`
- `fixtures/common/no-auth.json`, `fixtures/common/expired-auth.json`

## Milestones

### M1 - Project Setup
- Initialize package and TypeScript config.
- Add scripts: `lint`, `test`, `build`.
- Add plugin entrypoint.

### M2 - UX Mock + Formatting Prototype
- Build renderer variants for normal and small window mode.
- Validate line length behavior and truncation rules.
- Freeze copy style guidelines for subtle/professional tone.

### M3 - Domain + Adapter Abstraction
- Define core quota types and adapter interface.
- Add adapter registry and selection rules.

### M4 - Provider Adapters
- Parse OpenCode OAuth auth.
- Fetch and normalize usage payload for ChatGPT/Codex.
- Add Z.AI and Kimi adapters with endpoint-first strategy and inferred fallback.
- Handle missing auth, expired tokens, API failures, and unsupported usage APIs.
- Add model-awareness mapping if payload exposes model-specific counters.

### M5 - Native-Feeling Integration
- Add status tool endpoint output.
- Add optional `/usage` command integration.
- Add threshold crossing toasts.
- Trigger refresh pragmatically on relevant plugin events and model switches.

### M6 - Caching + Reactivity
- Implement TTL cache with per-scope keys and stale-while-revalidate.
- Add debounce/throttle guards to avoid excessive fetches.
- Keep UI responsive by serving cached snapshots first, then async refresh.

### M7 - Verification
- Unit tests for parser, normalizer, thresholds, and renderer.
- Unit tests for cache policy (hit/miss/stale) and reactivity triggers.
- Add fixture-driven tests for ChatGPT/Codex, Z.AI, and Kimi adapters.
- Manual smoke tests inside OpenCode TUI.

## Acceptance Criteria

- Plugin reads OpenCode credentials for supported providers successfully.
- Bars render accurately for ChatGPT/Codex, Z.AI, and Kimi payloads (or inferred fallback).
- Selected model is shown in output when provider exposes model-level usage data.
- Cache-first reads are fast, and refresh behavior is event-driven with bounded polling.
- Threshold toasts fire once per crossing and avoid spam.
- UI output remains compact and readable in small window mode.
- Output is subtle and non-intrusive by default (no excessive notifications).
- Failures degrade gracefully with actionable status messages.
- Tests pass for changed behavior.

## Risk Notes

- OpenCode plugin API does not currently expose persistent status-line injection.
- For a true always-visible bar, propose upstream OpenCode API extension in a follow-up PR.
- Some providers may not expose subscription limit APIs; inferred usage must be clearly labeled.

## Follow-up (V2 / PR Candidate)

- Propose `tui.status.item.set`-style plugin API in OpenCode core.
- Render persistent quota indicator in the TUI footer/status area.
- Reuse V1 adapter core without redesign.
