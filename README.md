# dev-standards

The shared **TypeScript/Node development standard** for TecNET-systems-GmbH. One central definition,
referenced by every project. Additive, low-disruption, and Claude-Code-native (everyone here uses Claude Code).

## What you get

- **Biome** — one fast tool for formatting **and** linting (shared config), instead of ESLint + Prettier.
- **Shared `tsconfig`** — one strict TypeScript base.
- **Reusable CI** — a single workflow: secret scan + typecheck + lint + tests + web build (+ advisory `npm audit`).
- **Claude Code harness** — hooks that auto-format on edit and block edits to generated files, plus the
  slash commands `/harness-init` and `/harness-audit`.
- **Secret scanning** (secretlint), a **fail-fast env** pattern, and a **security baseline** checklist.

## Installation (adopt in a project)

**Fastest:** in Claude Code, run **`/harness-init`** — it sets up everything below, additively, and asks
before touching anything that already exists.

**Manually** (nothing in your code is changed — all additive):

1. **CI** — add `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: pull_request
   jobs:
     ci:
       uses: TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml@v1
       with:
         postgres: true            # spin up Postgres for the backend job
         db-setup: npm run db:ci    # optional: migrate + seed the CI DB
         web-dir: web               # optional: build/test a web workspace
       secrets: inherit
   ```
   The workflow is public — this works with **no token**.

2. **Format/lint** — `biome.json`:
   ```json
   {
     "extends": ["@tecnet-systems-gmbh/biome-config/biome"],
     "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true, "defaultBranch": "main" }
   }
   ```
   Add scripts: `"lint": "biome check --changed"`, `"format": "biome format --write"`.

3. **Types** — `tsconfig.json`: `{ "extends": "@tecnet-systems-gmbh/tsconfig/base.json", "include": ["src"] }`

4. **Claude Code harness** — copy `templates/.claude/` into the repo root, then create
   `.claude/protected-paths.json` listing your generated/build dirs (e.g. `["src/generated/", "dist/"]`).

5. **Secret scan** — copy `templates/.secretlintrc.json`.

> **Installing the shared config packages** (`@tecnet-systems-gmbh/*`) needs a one-time `.npmrc` — GitHub
> Packages requires auth even for public packages:
> ```
> @tecnet-systems-gmbh:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
> ```
> Locally: `export GITHUB_TOKEN=$(gh auth token)` (login needs `read:packages`). CI uses its built-in token.
> **No token / want zero setup?** Copy the `biome.json` contents inline instead of `extends` — you just
> re-sync updates by hand.

## Commands

**Daily** (standard npm scripts each project defines):

| Command | Does |
|---|---|
| `npm run lint` | Biome check on **changed** files (format-on-touch) |
| `npm run format` | Format the whole repo |
| `npm run check` | Typecheck (`tsc`) — plus any project drift/test gates |
| `npm test` | Run tests |

**Claude Code slash commands:**

- **`/harness-init`** — adopt the standard in the current repo (additive).
- **`/harness-audit`** — audit tests + the security baseline. Returns a **phase-calibrated** action list:
  🔧 security *defects* to fix now vs ⏳ compliance *capabilities* to track as pre-production backlog.

**Automatic** (Claude Code hooks — no command needed): every file you edit is formatted + safe-fixed, and
edits to generated/build files are blocked.

## How it works

- **Format-on-touch.** A `PostToolUse` hook formats only the file just edited, so a codebase converges to
  the standard file-by-file — no blame-destroying big-bang reformat. Great for existing projects.
- **Guarantees, not just suggestions.** Hooks *enforce* (auto-format, block generated-file edits) what a
  `CLAUDE.md` can only ask for.
- **Single source.** Projects *reference* the shared CI workflow and configs (pinned to `@v1`), so a
  standard update propagates without copy-paste.
- **CI is the shared gate** (runs on pull requests): secret scan (blocking) + typecheck + lint + tests +
  web build + `npm audit` (advisory). Local hooks give fast feedback; CI is the reproducible,
  non-bypassable merge gate for the team.
- **Audit with restraint.** `/harness-audit` deliberately separates code-level security defects (fix now,
  phase-independent) from compliance/process capabilities (decide before go-live; don't over-build early).

## Reference

| Path | Purpose |
|---|---|
| `packages/biome-config` | `@tecnet-systems-gmbh/biome-config` — shared Biome config (format + lint). The default. |
| `packages/tsconfig` | `@tecnet-systems-gmbh/tsconfig` — strict TypeScript base. |
| `packages/eslint-config`, `packages/prettier-config` | Opt-in, for projects needing type-aware ESLint rules Biome lacks. |
| `templates/.claude/` | Hooks (`format-on-edit`, `block-generated`) + commands (`/harness-init`, `/harness-audit`). |
| `templates/` | `CLAUDE.md`, `gitignore`, `.env.example`, `.secretlintrc.json`, `env.ts`, `SECURITY-baseline.md`, `dependabot.yml`. |
| `.github/workflows/node-ci.yml` | The reusable CI pipeline. |
| [`docs/plan.md`](docs/plan.md) | The full concept & rationale. |

## Status

Public. Config packages published to GitHub Packages. **tecnet-v2** is the reference adopter (Biome +
harness + shared CI, green). Possible next steps: `knip` (dead-code), `commitlint` (commit hygiene), and a
thin `@tecnet-systems-gmbh/harness` CLI to replace the copy-the-templates step with `npx harness init/update`.
