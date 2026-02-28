# Architecture

## Design Principles

1. **Plugin → Interface → Implementation**: Clean dependency direction
2. **Separation of Concerns**: Data retrieval separate from rendering
3. **Privacy-First**: Never store conversation content
4. **Theme-Aware**: Output adapts to host environment

## Component Overview

### Plugin Layer (`src/plugin.ts`)

Entry point for OpenCode. Handles:

- Tool registration (`subscription-status`)
- Command registration (`/status`)
- Header update routing

```typescript
export const SubscriptionStatusPlugin: Plugin = async (_ctx) => {
  return {
    tool: { 'subscription-status': { ... } },
    command: { status: { ... } },
  }
}
```

### Client Layer (`src/client.ts`)

Unified interface for quota status:

- Coordinates all providers
- Manages cache lifecycle
- Routes header updates

```typescript
const client = new SubscriptionClient()
await client.getStatus({ providerId: 'chatgpt-codex' })
client.updateFromHeaders(providerId, headers)
```

### Interface Layer (`src/interfaces/`)

Defines contracts:

**Types** (`types.ts`):

- `ProviderId` - Union of supported providers
- `QuotaSnapshot` - Normalized quota data
- `QuotaWindow` - Usage window (5h, weekly, etc.)
- `QuotaCredit` - Usage metrics

**Provider** (`provider.ts`):

- `StatusProvider` interface
- `ProviderRegistry` for provider lookup
- Helper functions: `calculateCredit`, `isLowThreshold`, `isExhausted`

### Provider Layer (`src/providers/`)

Concrete implementations:

| Provider      | Auth Source                         | Header Prefix |
| ------------- | ----------------------------------- | ------------- |
| ChatGPT/Codex | `~/.local/share/opencode/auth.json` | `x-codex-`    |
| Z.AI          | Same                                | `x-zai-`      |
| Kimi          | Same                                | `x-kimi-`     |

Each provider:

1. Reads auth from OpenCode's auth file
2. Extracts usage from response headers
3. Normalizes to `QuotaSnapshot`

### Core Layer (`src/core/`)

**Cache** (`cache.ts`):

- TTL-based expiration
- Stale-while-revalidate
- Privacy-aware (only quota metadata)

**Thresholds** (`thresholds.ts`):

- Detects 50%/75%/90% crossings
- Anti-spam cooldown
- Event callbacks

**Reactivity** (`reactivity.ts`):

- Debounced refresh
- Background polling option
- Event-driven updates

### UI Layer (`src/ui/`)

**Theme** (`theme.ts`):

- Color definitions matching OpenCode
- `colorize()` helper
- Time formatting utilities

**Bar** (`bar.ts`):

- `renderBar()` - `[████░░░░]` visualization
- `renderSnapshot()` - Compact/normal output
- `renderDetailed()` - Full metadata view

## Data Flow

```
1. User runs /status command
         │
         ▼
2. Command handler calls subscriptionClient.getStatus()
         │
         ▼
3. Client checks cache
    ├── Hit: Return cached QuotaSnapshot
    └── Miss: Call provider.fetchUsage()
         │
         ▼
4. Provider returns QuotaSnapshot (from headers or error)
         │
         ▼
5. Client caches and returns snapshot
         │
         ▼
6. Renderer formats output (renderSnapshot/renderDetailed)
         │
         ▼
7. Output displayed to user
```

## Header Update Flow

```
1. OpenCode makes API request to provider
         │
         ▼
2. Response includes usage headers
         │
         ▼
3. Plugin intercepts (if hook available)
         │
         ▼
4. client.updateFromHeaders(providerId, headers)
         │
         ▼
5. Provider.updateFromHeaders() extracts data
         │
         ▼
6. Cache invalidated for fresh next read
```

## Extension Points

### Adding a New Provider

1. Create `src/providers/new-provider.ts`:

```typescript
class NewProvider implements StatusProvider {
  readonly id: ProviderId = 'new-provider'
  readonly name = 'New Provider'
  readonly capabilities = { ... }

  async fetchUsage(options?) { ... }
  async isAvailable() { ... }
  updateFromHeaders(headers) { ... }
}
```

2. Add to `ProviderId` type in `types.ts`

3. Register in `client.ts`

### Custom Renderers

```typescript
import type { QuotaSnapshot } from 'opencode-subscription-status'

function customRenderer(snapshot: QuotaSnapshot): string {
  // Custom formatting logic
}
```

## Constants

Located in `src/interfaces/types.ts`:

| Constant                          | Value        | Purpose             |
| --------------------------------- | ------------ | ------------------- |
| `CACHE_DEFAULT_TTL_MS`            | 60000        | Cache lifetime      |
| `CACHE_STALE_WHILE_REVALIDATE_MS` | 30000        | Stale grace period  |
| `THRESHOLD_LEVELS`                | [50, 75, 90] | Alert thresholds    |
| `LOW_THRESHOLD_PERCENTAGE`        | 75           | "Low" status        |
| `EXHAUSTED_THRESHOLD_PERCENTAGE`  | 100          | "Exhausted" status  |
| `BAR_SEGMENTS`                    | 8            | Bar character count |
