# Development Guide

## Prerequisites

- Node.js 20+
- npm or Bun
- Git

## Setup

```bash
# Clone the repository
git clone https://github.com/raulcorreia7/opencode-subscription-status.git
cd opencode-subscription-status

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Development Workflow

### Build Commands

```bash
npm run build          # Compile TypeScript
npm run build:watch    # Watch mode for development
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm test               # Run all tests
npm run all            # Full verification (lint, format, test, build)
```

### Test Commands

```bash
npm test               # All tests
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e       # End-to-end tests
npm run test:watch     # Watch mode
```

## Project Structure

```
opencode-subscription-status/
├── src/
│   ├── interfaces/     # Types and contracts
│   ├── providers/      # Provider implementations
│   ├── core/           # Cache, thresholds, reactivity
│   ├── ui/             # Rendering
│   ├── tools/          # Tool handlers
│   ├── commands/       # Command handlers
│   └── plugin.ts       # Plugin entry point
├── tests/
│   ├── unit/           # Isolated tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── fixtures/           # Mock data
├── docs/               # Documentation
└── dist/               # Built output
```

## Testing Locally

### Method 1: Local Plugin Directory

```bash
# Build the plugin
npm run build

# Link to your OpenCode project
mkdir -p /path/to/your/project/.opencode/plugins
ln -s $(pwd)/dist /path/to/your/project/.opencode/plugins/subscription-status

# Restart OpenCode and test
```

### Method 2: npm link

```bash
# In the plugin directory
npm link

# In your OpenCode project
cd /path/to/your/project
npm link opencode-subscription-status

# Add to opencode.json
echo '{"plugin": ["opencode-subscription-status"]}' > opencode.json

# Restart OpenCode and test
```

### Method 3: Global Plugin

```bash
# Build the plugin
npm run build

# Link globally
mkdir -p ~/.config/opencode/plugins
ln -s $(pwd)/dist ~/.config/opencode/plugins/subscription-status

# Restart OpenCode and test
```

## Adding a New Provider

1. Create provider file in `src/providers/`:

```typescript
// src/providers/new-provider.ts
import type { ProviderId, QuotaSnapshot, StatusProvider } from '../interfaces/types.js'

class NewProvider implements StatusProvider {
  readonly id: ProviderId = 'new-provider'
  readonly name = 'New Provider'
  readonly capabilities = { ... }

  async fetchUsage(options?) { ... }
  async isAvailable() { ... }
  updateFromHeaders(headers) { ... }
}

export const newProvider = new NewProvider()
```

2. Add to `ProviderId` type in `src/interfaces/types.ts`

3. Register in `src/client.ts`

4. Add tests in `tests/unit/` and `tests/integration/`

5. Add fixtures in `fixtures/new-provider/`

## Debugging

### Enable Verbose Output

```typescript
import { subscriptionClient } from "opencode-subscription-status"

const snapshot = await subscriptionClient.getStatus({
  providerId: "chatgpt-codex",
  skipCache: true, // Bypass cache
})

console.log(JSON.stringify(snapshot, null, 2))
```

### Check Auth Status

```bash
# View auth file
cat ~/.local/share/opencode/auth.json

# Check if provider is available
opencode auth status
```

### Manual Testing

```bash
# In your OpenCode project with the plugin linked
/status --verbose
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full verification: `npm run all`
4. Commit: `git commit -m "chore: release v1.2.3"`
5. Tag: `git tag v1.2.3`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and add tests
4. Run verification: `npm run all`
5. Commit: `git commit -m "feat: my feature"`
6. Push: `git push origin feat/my-feature`
7. Open a Pull Request

## Code Style

- Double quotes for strings
- No semicolons
- 2-space indentation
- 100 character line width
- Explicit types for public APIs
- Comments for non-obvious logic

Run `npm run format` before committing.
