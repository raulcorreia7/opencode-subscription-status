# OpenCode Subscription Status Plugin

An OpenCode plugin that shows subscription usage status for ChatGPT/Codex, Z.AI Coding Plan, and Kimi.

## Features

- Unified interface to get quota status from any provider
- Support for ChatGPT/Codex, Z.AI Coding Plan, and Kimi
- Compact usage bars with theme-aware colors
- `/status` command for detailed output
- Privacy-first: only stores quota metadata, never conversation content

## Quick Start

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

Then restart OpenCode. Use `/status` to check your subscription usage.

## Documentation

| Document                                     | Description                                |
| -------------------------------------------- | ------------------------------------------ |
| [Installation Guide](./docs/INSTALLATION.md) | Install via npm, local plugin, or npm link |
| [Development Guide](./docs/DEVELOPMENT.md)   | Build, test, and contribute                |
| [API Reference](./docs/API.md)               | Complete API documentation                 |
| [Architecture](./docs/ARCHITECTURE.md)       | System design and components               |
| [Privacy Policy](./docs/PRIVACY.md)          | Data handling and privacy                  |

## Usage

### Via Command

```bash
/status              # Show all providers
/status --verbose    # Detailed view
/status --provider chatgpt-codex  # Specific provider
```

### Via Tool

```javascript
// Check all providers
await tools["subscription-status"]()

// Check specific provider with details
await tools["subscription-status"]({
  provider: "chatgpt-codex",
  detailed: true,
})
```

### Programmatic API

```typescript
import { subscriptionClient, renderSnapshot } from "opencode-subscription-status"

const snapshot = await subscriptionClient.getStatus({
  providerId: "chatgpt-codex",
  modelId: "gpt-5.3-codex",
})

console.log(renderSnapshot(snapshot, { colorize: true }))
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

────────────────────────────────────────
```

## Supported Providers

| Provider         | ID                | Windows    |
| ---------------- | ----------------- | ---------- |
| ChatGPT/Codex    | `chatgpt-codex`   | 5h, weekly |
| Z.AI Coding Plan | `zai-coding-plan` | 5h, weekly |
| Kimi             | `kimi`            | window     |

## Local Development

```bash
# Clone and build
git clone https://github.com/raulcorreia7/opencode-subscription-status.git
cd opencode-subscription-status
npm install
npm run build

# Link locally for testing
mkdir -p ~/.config/opencode/plugins
ln -s $(pwd)/dist ~/.config/opencode/plugins/subscription-status

# Restart OpenCode and test
/status
```

See [Installation Guide](./docs/INSTALLATION.md) for all installation methods.

## Commands

| Command          | Description          |
| ---------------- | -------------------- |
| `npm run build`  | Compile TypeScript   |
| `npm run lint`   | Run ESLint           |
| `npm run format` | Format with Prettier |
| `npm test`       | Run all tests        |
| `npm run all`    | Full verification    |

## License

MIT
