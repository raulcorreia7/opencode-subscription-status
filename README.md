# OpenCode Subscription Status Plugin

An OpenCode plugin that shows subscription usage status for ChatGPT/Codex, Z.AI Coding Plan, and Kimi with a provider abstraction layer and model-aware output.

## Features

- Unified interface to get quota status from any provider
- Support for ChatGPT/Codex, Z.AI Coding Plan, and Kimi
- Compact usage bars with OpenCode theme colors
- `/status` command for detailed output
- TTL cache with stale-while-revalidate
- Threshold crossing detection with anti-spam logic

## Installation

```bash
npm install opencode-subscription-status
```

Or configure in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

## Usage

### Via Tool

The plugin exposes a `subscription-status` tool:

```javascript
// Check all providers
await tools['subscription-status']()

// Check specific provider
await tools['subscription-status']({ provider: 'chatgpt-codex' })

// Check with model context
await tools['subscription-status']({ provider: 'chatgpt-codex', model: 'gpt-5.3-codex' })

// Detailed output
await tools['subscription-status']({ detailed: true })
```

### Via Command

```bash
/status              # Show compact status for all providers
/status --verbose    # Show detailed status
/status --provider chatgpt-codex  # Specific provider
```

### Programmatic API

```typescript
import { subscriptionClient, renderSnapshot, renderDetailed } from 'opencode-subscription-status'

// Get status
const snapshot = await subscriptionClient.getStatus({
  providerId: 'chatgpt-codex',
  modelId: 'gpt-5.3-codex',
})

// Render output
console.log(renderSnapshot(snapshot, { colorize: true }))
console.log(renderDetailed(snapshot, { colorize: true }))

// Get all providers
const providers = await subscriptionClient.getAvailableProviders()
```

## Output Examples

### Compact Mode

```
gpt-5.3-codex  5h [████████░░] 58%  wk [███████░░░] 52%
```

### Normal Mode

```
Usage
Model   gpt-5.3-codex
5h      [████████░░░░░░░░] 58%  reset 2h 10m
Weekly  [███████░░░░░░░░░] 52%  reset Tue 09:00
```

### Detailed Mode

```
────────────────────────────────────────
Subscription Status
────────────────────────────────────────

Provider: ChatGPT/Codex
Model:    gpt-5.3-codex

5H
  Usage:  [████████░░░░░░░░] 58%
  Used:   58 / 100
  Left:   42
  Reset:  2h 10m

WEEKLY
  Usage:  [███████░░░░░░░░░] 52%
  Used:   52 / 100
  Left:   48
  Reset:  2d 5h

────────────────────────────────────────
```

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

## Supported Providers

| Provider         | ID                | Windows    |
| ---------------- | ----------------- | ---------- |
| ChatGPT/Codex    | `chatgpt-codex`   | 5h, weekly |
| Z.AI Coding Plan | `zai-coding-plan` | 5h, weekly |
| Kimi             | `kimi`            | window     |

## Commands

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `npm run build`            | Compile TypeScript                  |
| `npm run lint`             | Run ESLint                          |
| `npm run format`           | Format with Prettier                |
| `npm test`                 | Run all tests                       |
| `npm run test:unit`        | Run unit tests                      |
| `npm run test:integration` | Run integration tests               |
| `npm run test:e2e`         | Run e2e tests                       |
| `npm run all`              | Run lint, format:check, test, build |

## Project Structure

```
src/
├── interfaces/          # Types and contracts
│   ├── types.ts         # Domain types
│   └── provider.ts      # StatusProvider interface
├── providers/           # Provider implementations
│   ├── chatgpt-codex.ts
│   ├── zai-coding-plan.ts
│   └── kimi.ts
├── core/                # Core utilities
│   ├── cache.ts         # TTL cache
│   ├── thresholds.ts    # Crossing detection
│   └── reactivity.ts    # Refresh scheduler
├── ui/                  # Rendering
│   ├── theme.ts         # OpenCode theme colors
│   └── bar.ts           # Text bar renderer
├── tools/               # Tool handlers
├── commands/            # Command handlers
└── plugin.ts            # OpenCode plugin entry

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── e2e/                 # End-to-end tests
```

## License

MIT
