# API Reference

## SubscriptionClient

Main client for interacting with subscription status.

### Constructor

```typescript
import { SubscriptionClient } from 'opencode-subscription-status'

const client = new SubscriptionClient(options?)
```

**Options:**

| Option       | Type   | Default | Description                    |
| ------------ | ------ | ------- | ------------------------------ |
| `cacheTtlMs` | number | 60000   | Cache lifetime in milliseconds |

### Methods

#### getStatus

Get quota snapshot for a specific provider.

```typescript
const snapshot = await client.getStatus({
  providerId: 'chatgpt-codex',
  modelId?: 'gpt-5.3-codex',
  skipCache?: false,
})
```

**Returns:** `Promise<QuotaSnapshot>`

#### getAllStatus

Get quota snapshots for all configured providers.

```typescript
const statuses = await client.getAllStatus()
// Returns: Map<ProviderId, QuotaSnapshot>
```

**Returns:** `Promise<Map<ProviderId, QuotaSnapshot>>`

#### getAvailableProviders

List providers with valid authentication.

```typescript
const providers = await client.getAvailableProviders()
// Returns: ['chatgpt-codex', 'zai-coding-plan', 'kimi']
```

**Returns:** `Promise<ProviderId[]>`

#### updateFromHeaders

Update quota data from API response headers.

```typescript
client.updateFromHeaders('chatgpt-codex', response.headers)
```

**Parameters:**

- `providerId`: Provider identifier
- `headers`: HTTP Headers object

#### onHeaderUpdate

Subscribe to header update events.

```typescript
const unsubscribe = client.onHeaderUpdate((providerId, headers) => {
  console.log(`Updated ${providerId}`)
})

// Later: unsubscribe()
```

**Returns:** Unsubscribe function

#### invalidateCache

Clear cached data.

```typescript
// Clear specific provider
client.invalidateCache('chatgpt-codex')

// Clear all
client.invalidateCache()
```

---

## Types

### ProviderId

```typescript
type ProviderId = 'chatgpt-codex' | 'zai-coding-plan' | 'kimi'
```

### QuotaSnapshot

```typescript
interface QuotaSnapshot {
  provider: ProviderId
  account?: string
  model?: string
  windows: QuotaWindow[]
  fetchedAt: Date
  error?: {
    code: string
    message: string
  }
}
```

### QuotaWindow

```typescript
interface QuotaWindow {
  id: string // '5h', 'weekly', 'window'
  label: string // Display label
  credit: QuotaCredit
  resetsAt?: Date
  isExhausted: boolean
  isLow: boolean
}
```

### QuotaCredit

```typescript
interface QuotaCredit {
  used: number
  limit: number
  remaining: number
  percentage: number
}
```

### RenderOptions

```typescript
interface RenderOptions {
  compact?: boolean // Single-line output
  showReset?: boolean // Show reset time
  colorize?: boolean // Apply colors
  maxLineLength?: number // Truncate lines
}
```

---

## Rendering Functions

### renderSnapshot

Render a quota snapshot as a string.

```typescript
import { renderSnapshot } from 'opencode-subscription-status'

const output = renderSnapshot(snapshot, {
  compact: false,
  showReset: true,
  colorize: true,
})
```

**Output (normal):**

```
Usage
Model   gpt-5.3-codex
5h      [████████░░░░░░░░] 58%  reset 2h 10m
Weekly  [███████░░░░░░░░░] 52%  reset Tue 09:00
```

**Output (compact):**

```
gpt-5.3-codex  5h [████████░░] 58%  wk [███████░░░] 52%
```

### renderDetailed

Render a detailed view with all metadata.

```typescript
import { renderDetailed } from 'opencode-subscription-status'

const output = renderDetailed(snapshot, {
  colorize: true,
})
```

**Output:**

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

### renderBar

Render just the progress bar.

```typescript
import { renderBar } from 'opencode-subscription-status'

const bar = renderBar(58, { colorize: true })
// Returns: '[████████░░░░░░░░]'
```

---

## Core Modules

### SnapshotCache

Privacy-aware TTL cache.

```typescript
import { SnapshotCache } from 'opencode-subscription-status/core'

const cache = new SnapshotCache({
  defaultTtlMs: 60000,
  staleWhileRevalidateMs: 30000,
})

cache.set(snapshot, { modelId: 'gpt-5.3-codex' })
const cached = cache.get('chatgpt-codex', { modelId: 'gpt-5.3-codex' })
cache.invalidate('chatgpt-codex')
```

### ThresholdDetector

Detect usage threshold crossings.

```typescript
import { ThresholdDetector } from 'opencode-subscription-status/core'

const detector = new ThresholdDetector({
  levels: [50, 75, 90],
  cooldownMs: 300000,
})

detector.onCrossing((crossing) => {
  console.log(`${crossing.providerId} crossed ${crossing.level}%`)
})

const crossing = detector.check(snapshot)
```

**ThresholdCrossing:**

```typescript
interface ThresholdCrossing {
  level: number
  providerId: ProviderId
  modelId?: string
  percentage: number
  timestamp: Date
}
```

### ReactivityScheduler

Schedule debounced refreshes.

```typescript
import { ReactivityScheduler } from 'opencode-subscription-status/core'

const scheduler = new ReactivityScheduler({
  refreshIntervalMs: 60000,
  debounceMs: 5000,
})

scheduler.setRefreshFn(async () => {
  await client.invalidateCache()
})

scheduler.requestRefresh('chatgpt-codex')
scheduler.startBackgroundRefresh()
scheduler.dispose()
```

---

## Constants

```typescript
import {
  CACHE_DEFAULT_TTL_MS, // 60000
  CACHE_STALE_WHILE_REVALIDATE_MS, // 30000
  THRESHOLD_COOLDOWN_MS, // 300000
  THRESHOLD_LEVELS, // [50, 75, 90]
  LOW_THRESHOLD_PERCENTAGE, // 75
  EXHAUSTED_THRESHOLD_PERCENTAGE, // 100
  BAR_SEGMENTS, // 8
} from 'opencode-subscription-status'
```

---

## Error Codes

| Code               | Description                          |
| ------------------ | ------------------------------------ |
| `NO_AUTH`          | No authentication found for provider |
| `TOKEN_EXPIRED`    | OAuth token has expired              |
| `NO_USAGE_DATA`    | No usage headers received yet        |
| `UNKNOWN_PROVIDER` | Provider ID not recognized           |
