# Documentation

Welcome to the OpenCode Subscription Status Plugin documentation.

## Quick Links

| Document                                | Description                                |
| --------------------------------------- | ------------------------------------------ |
| [README](../README.md)                  | Quick start and overview                   |
| [Installation Guide](./INSTALLATION.md) | Install via npm, local plugin, or npm link |
| [Development Guide](./DEVELOPMENT.md)   | Build, test, and contribute                |
| [API Reference](./API.md)               | Complete API documentation                 |
| [Architecture](./ARCHITECTURE.md)       | System design and components               |
| [Privacy Policy](./PRIVACY.md)          | Data handling and privacy                  |

## Installation

### From npm (Recommended)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

### For Local Development

```bash
# Build the plugin
git clone https://github.com/raulcorreia7/opencode-subscription-status.git
cd opencode-subscription-status
npm install
npm run build

# Link globally
mkdir -p ~/.config/opencode/plugins
ln -s $(pwd)/dist ~/.config/opencode/plugins/subscription-status
```

See [Installation Guide](./INSTALLATION.md) for all methods.

## Quick Start

1. **Install**: Add to `opencode.json`
2. **Authenticate**: Run `opencode auth login`
3. **Use**: Run `/status` in OpenCode

## Common Tasks

### Check All Providers

```bash
/status
```

### Check Specific Provider

```bash
/status --provider chatgpt-codex
```

### Detailed View

```bash
/status --verbose
```

### Programmatic Access

```typescript
import { subscriptionClient } from "opencode-subscription-status"

const snapshot = await subscriptionClient.getStatus({
  providerId: "chatgpt-codex",
})

console.log(snapshot.windows[0]?.credit.percentage)
```

## Need Help?

- [Installation Guide](./INSTALLATION.md) - Setup instructions
- [Development Guide](./DEVELOPMENT.md) - Build and contribute
- [API Reference](./API.md) - Method signatures and types
- [Architecture](./ARCHITECTURE.md) - System design
- [Privacy Policy](./PRIVACY.md) - Data handling
