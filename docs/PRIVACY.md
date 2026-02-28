# Privacy Policy

## Summary

This plugin is designed with privacy as a fundamental principle. We collect **only** the minimum data necessary to display subscription usage percentages—nothing more.

## Data We Collect

### What Is Stored

| Data Type        | Example                | Purpose                   |
| ---------------- | ---------------------- | ------------------------- |
| Provider ID      | `chatgpt-codex`        | Identify which service    |
| Model name       | `gpt-5.3-codex`        | Show model-specific usage |
| Usage percentage | `58%`                  | Display quota consumption |
| Reset timestamp  | `2024-01-15T14:00:00Z` | Show when quota resets    |

### What Is NEVER Collected

- ❌ Conversation content
- ❌ Prompts or messages
- ❌ API request bodies
- ❌ API response bodies
- ❌ Code snippets
- ❌ File contents
- ❌ Personal information
- ❌ Authentication tokens (only checked, never stored)
- ❌ Session identifiers
- ❌ Usage logs or history

## Data Sources

All quota information comes exclusively from **HTTP response headers**:

### ChatGPT/Codex

```
x-codex-primary-used-percent: 58.0
x-codex-primary-window-minutes: 300
x-codex-primary-reset-at: 1705312800
x-codex-secondary-used-percent: 52.0
x-codex-secondary-reset-at: 1705831200
```

### Z.AI Coding Plan

```
x-zai-primary-used-percent: 80.0
x-zai-primary-reset-at: 1705312800
```

### Kimi

```
x-kimi-used-percent: 75.0
x-kimi-reset-at: 1705312800
```

These headers contain **only aggregate percentages**—no content, no context, no identifying information.

## Data Storage

### In-Memory Cache Only

- All data is stored in memory (RAM)
- No persistent storage (no files, no databases)
- Data is lost when OpenCode restarts
- Cache is automatically cleared on expiration (default: 60 seconds)

### Cache Contents

```typescript
interface CacheEntry {
  snapshot: QuotaSnapshot // Only quota metadata
  cachedAt: number // Timestamp
  ttlMs: number // Time-to-live
}
```

## Data Retention

| Data              | Retention Period          |
| ----------------- | ------------------------- |
| Quota snapshot    | 60-90 seconds (in memory) |
| Threshold state   | Until plugin reload       |
| Auth check result | Not stored                |

## Third-Party Sharing

**None.** This plugin:

- Does not send data to external servers
- Does not use analytics
- Does not connect to third-party services
- Only communicates with your configured AI provider

## Authentication

- Authentication is handled by OpenCode's built-in auth system
- This plugin only **checks** if auth exists
- Tokens are **never** stored by this plugin
- Tokens are **never** logged

## Open Source

This plugin is open source. You can:

- Review all code
- Audit data handling
- Verify privacy claims
- Contribute improvements

## Contact

For privacy concerns or questions:

- Open an issue on GitHub
- Review the source code

## Changes

We will update this policy if our data practices change. Significant changes will be noted in release notes.
