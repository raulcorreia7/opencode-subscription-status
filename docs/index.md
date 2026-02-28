# Documentation

Welcome to the OpenCode Subscription Status Plugin documentation.

## Quick Links

| Document                          | Description                  |
| --------------------------------- | ---------------------------- |
| [README](../README.md)            | Installation and quick start |
| [API Reference](./API.md)         | Complete API documentation   |
| [Architecture](./ARCHITECTURE.md) | System design and components |
| [Privacy Policy](./PRIVACY.md)    | Data handling and privacy    |

## Getting Started

1. **Install**: `npm install opencode-subscription-status`
2. **Configure**: Add to `opencode.json`
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
import { subscriptionClient } from 'opencode-subscription-status'

const snapshot = await subscriptionClient.getStatus({
  providerId: 'chatgpt-codex',
})

console.log(snapshot.windows[0]?.credit.percentage)
```

## Need Help?

- Check the [API Reference](./API.md) for detailed method signatures
- Review [Architecture](./ARCHITECTURE.md) to understand the system
- Read [Privacy Policy](./PRIVACY.md) for data handling details
