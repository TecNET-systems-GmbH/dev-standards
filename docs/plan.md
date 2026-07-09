# Dev Harness & CI — Concept (TecNET-systems-GmbH)

Company-wide, agent-first development harness for TypeScript/Node projects. One central definition,
referenced by every project; low intrusion; adoptable into existing repos; and — crucially — the CI
status and standard commands are **legible to AI coding agents** so they can self-verify and act.

This is a plan, not yet built. It turns the shared vision into a layered architecture and a phased
rollout. Where something is ambitious, it says so and proposes a pragmatic minimum first.

## Guiding principles

1. **Define once, reference everywhere.** Central reusable CI workflow + shared config packages;
   each project carries only a tiny caller + `extends`. Update the standard in one place.
2. **Low intrusion.** CI runs on PRs, is fast, and is *advisory by default* (shows status, does not
   block the merge). Teams can opt into blocking (required checks) per project later.
3. **Agent-legible.** Uniform command vocabulary + granular, named CI checks so an agent can run the
   right check locally and read `gh pr checks` / `gh run view --log-failed` to evaluate results.
4. **Gradual adoption.** Adding the harness to a legacy repo must not turn it red on day one
   (advisory-first, baseline the existing debt, tighten over time).
5. **Start small.** Ship a thin MVP (configs + hooks + one CI workflow), then layer on the ambitious
   parts (test tiers, agent ticket automation) once the base is proven.

## How it fits together

```
@tecnet-systems-gmbh/harness   ── init/doctor CLI: scaffolds a repo to the standard
        │ sets up ↓
   ┌────────────────────────────────────────────────────────────┐
   │ shared configs   eslint-config · tsconfig · prettier-config │  (versioned packages, extend in 1 line)
   │ npm scripts      check · lint · format · test:* · check:*   │  (uniform vocabulary; devs + agents + CI)
   │ git hooks        pre-commit: eslint --fix + prettier        │  (auto-format, fast)
   │ CI caller        uses: …/dev-standards/…/node-ci.yml@v1     │  (PR-only, calls the reusable workflow)
   │ CLAUDE.md        agent conventions (commits, tickets, …)    │  (the AI-harness proper)
   │ dependabot.yml   monthly, grouped, small PR cap             │
   └────────────────────────────────────────────────────────────┘
```

## 1. The harness package = a CLI that ships the commands — `@tecnet-systems-gmbh/harness`

The backbone. The "own npm package" is a **CLI with subcommands**. The *logic* of each command (which
tool, which flags) lives centrally in the package and is versioned — projects just call `harness <cmd>`,
and bumping the package version improves every project at once. Agents, devs, and CI all call the same CLI.

**Setup / inspection commands**
- `harness init` — scaffolds/updates a project to the standard: shared config `extends`, CI caller
  workflow, `dependabot.yml`, `CLAUDE.md` template, git hooks, and a per-project `harness.config`.
  Idempotent (re-run to pull standard updates).
- `harness doctor` — **environment check**: non-destructively inspects the repo and reports what's
  present/missing (tests? categorized api/web/security? hooks? configs extending the standard? CI wired?),
  offers to fix.

**Gate commands** (same names run locally, by agents, and in CI):
- `harness check` (types) · `harness lint` · `harness format[:check]`
- `harness test [--api|--web|--security|--all]`
- `harness redundancy` (dead code / duplication) · `harness drift` (generated-artifact drift)

**Per-project config** (`harness.config.ts`, tiny): declares the variance the CLI needs — `hasWeb`,
`hasDb`, test globs per category, node version. So one CLI adapts to each repo without hand-written scripts.

**npm scripts stay as thin aliases** (`"test:security": "harness test --security"`) for muscle memory
and so CI/tools that expect `npm run …` keep working — but the real logic is in the CLI, not duplicated
per project.

## 2. Standard command vocabulary (backed by the CLI, §1)

One vocabulary in every project — what devs type, what agents call, what CI runs. No per-project guessing.
Each maps to a `harness <cmd>` (logic central) with an optional `npm run` alias.

| Script | Purpose |
|---|---|
| `check` | `tsc --noEmit` (types) |
| `lint` | ESLint (shared config) |
| `format` | Prettier write; `format:check` for CI |
| `test` | all tests |
| `test:api` | backend/API tests |
| `test:web` | frontend tests |
| `test:security` | rights/permissions/security tests |
| `check:redundancy` | dead code / duplication (e.g. `knip`) — the "Aufräumen/Redundanzen prüfen" |
| `check:drift` | project-specific generated-artifact drift (e.g. `gen:prisma:check`) |

Agents get a documented mapping in `CLAUDE.md`: "run the security check" → `npm run test:security`, etc.

## 3. Test structure & tiers

**Categorize** tests so they can be run selectively — by filename suffix (`*.api.test.ts`,
`*.web.test.ts`, `*.security.test.ts`) or Vitest `projects`/tags. (Reality check: existing suites are
often mixed; categorize *gradually* — tag new tests, backfill opportunistically.)

**Run by importance (tiered), not the whole pipeline every time:**
- **PR (fast, always):** typecheck · lint · `test:api` + unit · **`test:security`** (security always runs).
- **Merge to main / nightly (heavier):** full suite · `test:web` + build · `check:redundancy`.
- Later, optionally: **affected-only** (run tests for changed areas) via tooling — but tiered is the
  reliable starting point; affected-detection is a v2 refinement.

## 4. CI — central reusable workflow

`TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml` (`on: workflow_call`), parametrized:
`node-version`, `postgres: bool`, `web-build: bool`, `tier: fast|full`. Emits **separate, named checks**
(Typecheck · Lint · Test:api · Test:security · …) so `gh pr checks` gives agents a per-gate signal.

Project caller (~8 lines), PR-only:
```yaml
name: CI
on: pull_request
jobs:
  ci:
    uses: TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml@v1
    with: { postgres: true, web-build: true, tier: fast }
    secrets: inherit
```

## 5. Agent conventions (the AI-harness) — in `CLAUDE.md`

- **Language & format:** English for code/comments/commits/tickets; domain terms stay German.
- **Commits:** Conventional Commits (`feat|fix|refactor|test|docs|build|chore`), AI co-author trailer.
- **Self-verification loop (the key agent capability):** after a change, run the local gates; after a
  push/PR, read CI via `gh pr checks <n>` and `gh run view --log-failed`, then fix + re-push. Documented
  as a repeatable playbook so any agent does it the same way.
- **Command playbook:** "security check / API tests / redundancy check" → the `test:*`/`check:*` scripts.
- **Tickets (ambitious — with a guardrail):** the agent drafts issues in a uniform template (language,
  labels, acceptance criteria), splits large work into structured sub-issues via `gh issue`. **Guardrail:**
  agent *proposes* the breakdown for human approval before mass-creating — avoids ticket spam. Start with
  a ticket *template* + a "draft issues" playbook; full autonomy later once trusted.

## 6. Git hooks

- **pre-commit** (husky + lint-staged): `eslint --fix` + `prettier --write` on staged files (shared
  config). Fast, auto-formats — devs and agents produce identical style.
- **commit-msg** (optional): `commitlint` enforcing Conventional Commits.
- Note: adopting Prettier org-wide costs a one-time full reformat per repo (large but mechanical diff).

## Adoption

- **New projects:** a **template repo** in the org, pre-wired → "Use this template".
- **Existing projects:** `harness init` + **advisory-first** (lint/type checks non-blocking at first;
  baseline existing warnings), tighten to blocking when the team is ready.

## Trade-offs / honest advice (for a first build)

- **Don't build all layers at once.** MVP = shared eslint/tsconfig/prettier + hooks + one PR-only CI
  workflow + CLAUDE.md. That already delivers 80% of the value. Test tiers and agent-ticket automation
  are follow-ups.
- **Test categorization is a convention, not a switch** — it pays off only as tests get tagged; plan it
  as gradual, not a big reorg.
- **Agent ticket automation** is the most novel/risky part — keep a human approval gate initially.
- **Advisory vs blocking:** start advisory (visibility for agents + devs) to avoid the intrusion you
  experienced; make it blocking per project once it's trusted and green.
- **CLI indirection has a cost:** wrapping tools behind `harness <cmd>` centralizes logic (the win) but
  adds a layer + a per-project `harness.config`. Keep the CLI thin (it should mostly shell out to eslint/
  vitest/knip with standard flags), and let `harness doctor` explain exactly what each command runs.

## Phased rollout

- **Phase 0 (now):** de-noise `tecnet-v2` CI → PR-only, tame Dependabot. Immediate relief.
- **Phase 1:** create `dev-standards` repo; extract eslint-config + tsconfig + CLAUDE.md + the reusable
  `node-ci.yml`; publish `@v1` (GitHub Packages). Add Prettier to the shared config.
- **Phase 2:** `harness init`/`doctor` CLI (MVP). Make `tecnet-v2` the reference adopter (caller + extends).
- **Phase 3:** add test tiers + `check:redundancy` + security-test category to the standard.
- **Phase 4:** agent ticket/playbook conventions; template repo for new projects; onboard the next repo.
