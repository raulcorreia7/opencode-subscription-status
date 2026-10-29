# Contributing to opencode-subscription-status

TypeScript plugin for OpenCode that renders subscription usage for ChatGPT/Codex, Z.AI Coding
Plan, and Kimi. Source lives in `src/`, tests in `tests/` (unit, integration, e2e). Keep it
privacy-first: store quota metadata only, never conversation content.

## Prerequisites

- Node.js >= 20
- npm (the repo commits `package-lock.json`; keep it updated with dependency changes)

## Setup

```bash
npm install
npm run build      # compile TypeScript to dist/
```

Test the plugin inside OpenCode by linking the build output:

```bash
mkdir -p ~/.config/opencode/plugins
ln -s "$(pwd)/dist" ~/.config/opencode/plugins/subscription-status
```

Restart OpenCode and run `/status`.

## Before opening a pull request

```bash
npm run all        # lint + format:check + test + build
```

Individually: `npm run lint`, `npm run format` (Prettier), `npm test`, or a single layer with
`npm run test:unit`, `test:integration`, `test:e2e`, `test:coverage`.

Add a matching test under `tests/` for every new provider or behavior change; document new
providers in the README table and `docs/`.

## Pull request flow

1. Fork the repository and clone your fork.
2. Branch from `master`: `git checkout -b feature/short-name`.
3. Use Conventional Commit messages (`feat:`, `fix:`, `chore:`).
4. Push and open a pull request against `master`; include the output of `npm run all`.
