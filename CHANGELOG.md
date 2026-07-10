# Changelog

Brief state of the TecNET dev-standards. Config packages carry their own semver; the reusable CI
workflow and `templates/` are consumed at the `@v1` tag (a moving pointer to the latest v1.x).

## Config packages (GitHub Packages)

| Package | Version | Notes |
|---|---|---|
| `@tecnet-systems-gmbh/biome-config` | 0.1.3 | Biome 2.5; file-length warning (`noExcessiveLinesPerFile`, 500); **policy-matched severities** (`noExplicitAny`/`noNonNullAssertion` off; noisy React/style rules → warn) so adopters see few errors. |
| `@tecnet-systems-gmbh/tsconfig` | 0.1.0 | Strict TS base. |
| `@tecnet-systems-gmbh/eslint-config` | 0.1.0 | Opt-in (type-aware rules Biome lacks). |
| `@tecnet-systems-gmbh/prettier-config` | 0.1.0 | Opt-in (pairs with ESLint). |

## What the standard provides

- **Biome-first** format + lint (shared config), adopted **format-on-touch** (no big-bang reformat).
- **Claude Code harness** (`templates/.claude/`): hooks `format-on-edit` + `block-generated`; slash
  commands `/harness-init`, `/harness-audit`.
- **Reusable CI** (`node-ci.yml`, public): secret scan (blocking) + typecheck + lint + tests + web build +
  `npm audit` (advisory).
- **Secret scanning** (secretlint), **fail-fast env** pattern (`env.ts`), **security baseline**
  (`SECURITY-baseline.md`) — with the audit's defects-now (🔧) vs capabilities-later (⏳) split.
- **Quiet by default**: PR-only CI; Dependabot **security-updates only** (version bumps opt-in via
  `templates/dependabot.optin.yml`); recommend Actions email = "failed only".

## Reference adopter

- **tecnet-v2** — adopted the full standard; CI green. Running TypeScript 7 (native) and Vite 8 (Rolldown).
