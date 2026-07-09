# dev-standards

Company-wide development harness & CI standards for TecNET-systems-GmbH (TypeScript/Node).
One central definition, referenced by every project — see [`docs/plan.md`](docs/plan.md) for the concept.

## What's here

| Path | Purpose |
|---|---|
| `packages/biome-config` | `@tecnet-systems-gmbh/biome-config` — **shared Biome config (format + lint). The default standard.** |
| `packages/tsconfig` | `@tecnet-systems-gmbh/tsconfig` — shared strict `tsconfig` base. |
| `packages/eslint-config` | `@tecnet-systems-gmbh/eslint-config` — shared ESLint 9 flat config. **Opt-in** for projects that need type-aware rules or a plugin Biome lacks; not the default. |
| `packages/prettier-config` | `@tecnet-systems-gmbh/prettier-config` — shared Prettier config (pairs with the ESLint opt-in). |
| `templates/.claude/` | Claude Code harness: `settings.json` (hooks), `hooks/` (format-on-edit + block-generated), `commands/` (`/harness-init`, `/harness-audit`). |
| `templates/` | Drop-in templates: `CLAUDE.md` (agent conventions), `dependabot.yml`. |
| `.github/workflows/node-ci.yml` | Reusable CI workflow (`workflow_call`) — projects reference it. |

## Philosophy: low disruption, integrates into existing projects

Everything here is **additive**. The lint/format standard is adopted **format-on-touch** — a Claude Code
`PostToolUse` hook formats only the file just edited, so a codebase converges to the standard file-by-file
instead of via one blame-destroying big-bang reformat. Because the whole team uses Claude Code, the harness
lives in `.claude/` (hooks + slash commands): hooks give *guarantees* (auto-format, block edits to generated
files) where `CLAUDE.md` only gives *suggestions*.

## Using it in a project

The fastest path is the Claude Code command **`/harness-init`** (copied from `templates/.claude/commands/`),
which sets the below up additively. Manually:

`biome.json`:
```json
{
  "extends": ["@tecnet-systems-gmbh/biome-config/biome"],
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true, "defaultBranch": "main" }
}
```

`tsconfig.json`:
```json
{ "extends": "@tecnet-systems-gmbh/tsconfig/base.json", "compilerOptions": { "rootDir": "src", "outDir": "dist" }, "include": ["src"] }
```

Claude Code harness: copy `templates/.claude/` into the project root; add a `.claude/protected-paths.json`
listing the project's generated/build dirs.

CI (`.github/workflows/ci.yml`):
```yaml
name: CI
on: pull_request
jobs:
  ci:
    uses: TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml@v1
    with: { postgres: true, web-dir: web }
    secrets: inherit
```

> Installing the private `@tecnet-systems-gmbh/*` packages needs an `.npmrc`:
> `@tecnet-systems-gmbh:registry=https://npm.pkg.github.com` + a token (`read:packages`). CI uses the
> built-in `GITHUB_TOKEN`.

## Status

Phase 1. Config packages published to GitHub Packages (`tsconfig`, `eslint-config`, `prettier-config` at
`0.1.0`; `biome-config` pending publish). Claude Code harness templates added. Next: publish `biome-config`,
adopt in tecnet-v2 as the reference project, then the optional `@tecnet-systems-gmbh/harness` CLI.
