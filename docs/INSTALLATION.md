# Installation Guide

## Quick Start

### From npm (Recommended)

1. Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

2. Restart OpenCode. The plugin will be automatically installed.

### Usage

```bash
/status              # Show all providers
/status --verbose    # Detailed view
/status --provider chatgpt-codex  # Specific provider
```

Or via tool:

```javascript
await tools["subscription-status"]({ detailed: true })
```

---

## Installation Methods

### Method 1: npm Package (Recommended)

Add the plugin to your OpenCode configuration:

**Project-level** (`./opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

**Global** (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-subscription-status"]
}
```

OpenCode will automatically install the package using Bun at startup.

---

### Method 2: Local Plugin (For Development)

#### Option A: Project-level Plugin

1. Clone or symlink the plugin to your project:

```bash
# From your project root
mkdir -p .opencode/plugins
ln -s /path/to/opencode-subscription-status/dist .opencode/plugins/subscription-status
```

2. Or copy the built files:

```bash
mkdir -p .opencode/plugins/subscription-status
cp -r /path/to/opencode-subscription-status/dist/* .opencode/plugins/subscription-status/
```

#### Option B: Global Plugin

```bash
# Create global plugins directory if it doesn't exist
mkdir -p ~/.config/opencode/plugins

# Clone the repository
git clone https://github.com/raulcorreia7/opencode-subscription-status.git
cd opencode-subscription-status

# Build the plugin
npm install
npm run build

# Link to global plugins
ln -s $(pwd)/dist ~/.config/opencode/plugins/subscription-status
```

#### Option C: Using npm link (For Development)

```bash
# In the plugin directory
cd opencode-subscription-status
npm run build
npm link

# In your project (or globally for OpenCode)
cd /path/to/your/project
npm link opencode-subscription-status
```

Then add to `opencode.json`:

```json
{
  "plugin": ["opencode-subscription-status"]
}
```

---

## Plugin Load Order

OpenCode loads plugins in this order:

1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`./opencode.json`)
3. Global plugins (`~/.config/opencode/plugins/`)
4. Project plugins (`.opencode/plugins/`)

---

## Dependencies

### For npm Package

Dependencies are automatically managed by OpenCode using Bun.

### For Local Plugins

If using local plugins with external dependencies, create a `package.json` in your OpenCode config directory:

**~/.config/opencode/package.json**:

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^1.2.0"
  }
}
```

OpenCode will run `bun install` at startup.

---

## Authentication Setup

Before using the plugin, configure authentication for your providers:

### ChatGPT/Codex

```bash
opencode auth login
# Select "ChatGPT/Codex" when prompted
```

### Z.AI Coding Plan

```bash
opencode auth login
# Select "Z.AI" when prompted
```

### Kimi

```bash
opencode auth login
# Select "Kimi" when prompted
```

Authentication is stored in `~/.local/share/opencode/auth.json`.

---

## Verification

### Check Plugin is Loaded

```bash
/status
```

If configured correctly, you'll see usage status for your authenticated providers.

### Check Available Providers

```typescript
import { subscriptionClient } from "opencode-subscription-status"

const providers = await subscriptionClient.getAvailableProviders()
console.log(providers) // ['chatgpt-codex', 'zai-coding-plan', 'kimi']
```

---

## Troubleshooting

### Plugin Not Loading

1. Check the plugin is listed in `opencode.json`
2. Restart OpenCode
3. Check for errors in OpenCode logs

### No Providers Available

1. Run `opencode auth login` to configure a provider
2. Verify auth file exists: `~/.local/share/opencode/auth.json`

### Usage Data Not Available

Usage data is extracted from API response headers. Make an API request first, then check status.

### Local Plugin Not Working

1. Ensure the plugin is built (`npm run build`)
2. Check the symlink points to `dist/` directory
3. Verify `dist/plugin.js` exists

---

## Uninstallation

### Remove from npm

Remove from `opencode.json`:

```json
{
  "plugin": [] // Remove "opencode-subscription-status"
}
```

### Remove Local Plugin

```bash
# Project-level
rm -rf .opencode/plugins/subscription-status

# Global
rm -rf ~/.config/opencode/plugins/subscription-status
```

### Unlink npm link

```bash
npm unlink -g opencode-subscription-status
```
