# OpenCode Subscription Status Plugin

An OpenCode plugin that shows subscription usage status for ChatGPT/Codex, Z.AI Coding Plan, and Kimi.

## Overview

This plugin provides real-time visibility into your AI subscription quotas without leaving OpenCode. It tracks usage across multiple providers and presents the data in a clean, theme-aware format.

### Key Features

- **Multi-provider support**: ChatGPT/Codex, Z.AI Coding Plan, Kimi
- **Unified API**: Single interface to query any provider
- **Privacy-first**: Only stores quota metadata, never conversation content
- **Theme-aware**: Output adapts to OpenCode's color scheme
- **Efficient caching**: TTL-based cache with stale-while-revalidate
- **Threshold alerts**: Optional notifications at 50%, 75%, 90% usage

## Installation

```bash
npm install opencode-subscription-status
```

Or add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

## Quick Start

### Via Command

```bash
/status              # Show all providers
/status --verbose    # Detailed view
/status --provider chatgpt-codex  # Specific provider
```

### Via Tool

```javascript
// Check all providers
await tools['subscription-status']()

// Check specific provider with details
await tools['subscription-status']({
  provider: 'chatgpt-codex',
  detailed: true,
})
```

### Programmatic API

```typescript
import { subscriptionClient, renderSnapshot } from 'opencode-subscription-status'

const snapshot = await subscriptionClient.getStatus({
  providerId: 'chatgpt-codex',
  modelId: 'gpt-5.3-codex',
})

console.log(renderSnapshot(snapshot, { colorize: true }))
```

## Output Formats

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

### Detailed Mode (`--verbose`)

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

────────────────────────────────────────
```

## Supported Providers

| Provider         | ID                | Windows    | Auth Method |
| ---------------- | ----------------- | ---------- | ----------- |
| ChatGPT/Codex    | `chatgpt-codex`   | 5h, weekly | OAuth       |
| Z.AI Coding Plan | `zai-coding-plan` | 5h, weekly | API Key     |
| Kimi             | `kimi`            | window     | API Key     |

## Privacy

This plugin is designed with privacy as a core principle:

### What We Store

- Provider identification
- Model names
- Usage percentages (e.g., "58%")
- Reset timestamps

### What We NEVER Store

- Conversation content
- Request/response bodies
- User messages
- Prompts or completions
- Any PII or user-generated content

### Data Source

All quota data comes exclusively from HTTP response headers:

- `x-codex-primary-used-percent`
- `x-codex-secondary-used-percent`
- `x-zai-primary-used-percent`
- `x-kimi-used-percent`

These headers contain only aggregate usage percentages, never content.

## API Reference

### SubscriptionClient

```typescript
import { SubscriptionClient } from 'opencode-subscription-status'

const client = new SubscriptionClient({ cacheTtlMs: 60000 })
```

#### Methods

| Method                                   | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `getStatus(options)`                     | Get quota snapshot for a provider       |
| `getAllStatus()`                         | Get status for all configured providers |
| `getAvailableProviders()`                | List providers with valid auth          |
| `invalidateCache(providerId?)`           | Clear cached data                       |
| `updateFromHeaders(providerId, headers)` | Update quota from API response headers  |

### Rendering

```typescript
import { renderSnapshot, renderDetailed } from 'opencode-subscription-status'

// Compact single-line output
const compact = renderSnapshot(snapshot, { compact: true, colorize: true })

// Normal multi-line output
const normal = renderSnapshot(snapshot, { colorize: true })

// Detailed view with all metadata
const detailed = renderDetailed(snapshot, { colorize: true })
```

### Types

```typescript
interface QuotaSnapshot {
  provider: ProviderId
  account?: string
  model?: string
  windows: QuotaWindow[]
  fetchedAt: Date
  error?: { code: string; message: string }
}

interface QuotaWindow {
  id: string
  label: string
  credit: QuotaCredit
  resetsAt?: Date
  isExhausted: boolean
  isLow: boolean
}

interface QuotaCredit {
  used: number
  limit: number
  remaining: number
  percentage: number
}
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Plugin Entry                      │
│                   src/plugin.ts                      │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Subscription Client                    │
│                   src/client.ts                      │
│  • Unified getStatus() API                           │
│  • Header update routing                             │
│  • Cache coordination                                │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│ ChatGPT   │  │   Z.AI    │  │   Kimi    │
│ Provider  │  │ Provider  │  │ Provider  │
└───────────┘  └───────────┘  └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Interfaces                          │
│  • StatusProvider contract                           │
│  • QuotaSnapshot, QuotaWindow types                  │
│  • ProviderRegistry                                  │
└─────────────────────────────────────────────────────┘
```

## Development

### Commands

```bash
npm run build          # Compile TypeScript
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm test               # Run all tests
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e       # End-to-end tests
npm run all            # Full verification pipeline
```

### Project Structure

```
src/
├── interfaces/        # Types and contracts
│   ├── types.ts       # Domain types
│   └── provider.ts    # StatusProvider interface
├── providers/         # Provider implementations
│   ├── chatgpt-codex.ts
│   ├── zai-coding-plan.ts
│   └── kimi.ts
├── core/              # Core utilities
│   ├── cache.ts       # Privacy-aware TTL cache
│   ├── thresholds.ts  # Usage threshold detection
│   └── reactivity.ts  # Refresh scheduling
├── ui/                # Rendering
│   ├── theme.ts       # Theme colors
│   └── bar.ts         # Text bar renderer
├── tools/             # Tool handlers
├── commands/          # Command handlers
└── plugin.ts          # OpenCode plugin entry

tests/
├── unit/              # Isolated component tests
├── integration/       # Client + provider tests
└── e2e/               # Full output flow tests
```

## Configuration

### Environment Variables

None required. Authentication is handled through OpenCode's built-in auth system.

### Cache Settings

```typescript
const client = new SubscriptionClient({
  cacheTtlMs: 60000, // 1 minute default
})
```

### Threshold Detection

```typescript
import { ThresholdDetector } from 'opencode-subscription-status/core'

const detector = new ThresholdDetector({
  levels: [50, 75, 90],
  cooldownMs: 300000, // 5 minutes
})

detector.onCrossing((crossing) => {
  console.log(`Usage crossed ${crossing.level}%`)
})
```

## Troubleshooting

### "No authentication found"

Run `opencode auth login` and select your provider.

### "Usage data not yet available"

Make an API request first. The plugin extracts usage from response headers during normal API calls.

### "Token has expired"

Run `opencode auth login` to refresh your authentication.

## License

MIT
