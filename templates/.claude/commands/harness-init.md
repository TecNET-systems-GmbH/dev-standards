---
description: Adopt the TecNET dev-standards in this project — additively and without disrupting the codebase.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

Set up the shared TecNET dev-standards in **this** repository. The guiding rule is **low disruption**:
everything you add is additive and reversible; you do **not** reformat the existing codebase in bulk.

**Idempotent & merge-first.** This command must be safe to run on a project that already has a harness —
a previous dev-standards version, or an **ad-hoc one Claude Code set up earlier**. Re-running it must
**converge, not clobber**. For every file below, follow this rule:

- **absent** → add it;
- **present & identical** to the template → skip;
- **present & different** → **diff, merge additively, and report the deviations** for the user to decide.
  Never silently overwrite a file a project may have customized (settings, cadences, protected paths, hooks).

Work through these steps, confirming anything ambiguous with the user:

## 1. Detect before changing

- Read `package.json`, existing lint/format/test config, CI, and any current `.claude/` setup.
- **Inventory any existing harness first:** `.claude/settings.json` (which hooks?), `.claude/hooks/*`,
  `.claude/agents/*`, `.claude/commands/*`, `scripts/harness-check.mjs`, `.harness/status.json`, a CI
  workflow. Classify each as *matches the standard*, *ad-hoc/custom*, or *absent* — this drives the
  add-or-reconcile decision (per the merge-first rule above) for the rest of the steps.
- If the project already uses ESLint/Prettier or has its own conventions, **report the overlap and ask**
  before replacing anything. Do not rip out a working setup.

## 2. Formatting & linting (Biome, format-on-touch)

- Add `@biomejs/biome` as a devDependency and a `biome.json` that extends the shared config:
  ```json
  { "extends": ["@tecnet-systems-gmbh/biome-config/biome"],
    "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true, "defaultBranch": "main" },
    "files": { "includes": ["**", "!**/generated/**", "!**/dist/**"] } }
  ```
- Add scripts: `"format": "biome format --write"`, `"lint": "biome check"`, `"lint:fix": "biome check --write"`.
- **Add `.gitattributes`** (copy `templates/gitattributes`): `* text=auto eol=lf` — so Windows checkouts
  don't introduce CRLF, which conflicts with Biome's LF formatter and causes spurious local lint diffs.
- **Existing project → do the one-time adoption baseline** (this is what keeps the harness from falling on
  your feet). As a SEPARATE first commit: run `npx biome check --write .` (format + safe fixes) across the
  repo, resolve any remaining errors, commit it as `style: Biome baseline`, and add that commit's SHA to a
  `.git-blame-ignore-revs` file so `git blame` skips it. **Why:** without the baseline, the *first* edit to
  any pre-Biome file triggers a whole-file reformat (huge blame-destroying diff) and CI fails on the file's
  pre-existing lint. After the baseline, format-on-touch keeps everything clean with small diffs.
- **New/empty project**: skip the baseline — no legacy to format; the format-on-edit hook + pre-commit suffice.
- The shared Biome config is tuned to a pragmatic policy (`noExplicitAny`/`noNonNullAssertion` off; noisy
  React/style rules → warn), so an adopting project sees a handful of warnings, not hundreds of errors.

## 3. Claude Code harness

- Add-or-reconcile (per the merge-first rule) `.claude/hooks/format-on-edit.mjs`, `.claude/hooks/block-generated.mjs`,
  the `.claude/commands/`, and the `.claude/agents/` (`structure-review`, `cleanup`) from the dev-standards templates.
  - **`.claude/settings.json` — MERGE, never overwrite.** If it exists, add the standard `SessionStart` /
    `PreToolUse` / `PostToolUse` hook entries *only if missing*; keep any project-specific hooks the project
    already wired. A blind copy would drop an ad-hoc setup's own hooks.
  - **Existing same-named agents/commands/hooks** (e.g. a version Claude authored ad-hoc): don't clobber —
    diff, prefer the standard version, but **report** meaningful deviations instead of silently replacing.
- Create `.claude/protected-paths.json` listing **this** project's generated/build paths (e.g. Prisma output,
  codegen dirs) so the block-generated hook guards the right files. If it exists, **merge** — keep the
  project's entries, add any missing ones.

### 3b. Harness-health loop (proactive maintenance)

- Add-or-reconcile `scripts/harness-check.mjs` (bring it to the template version; report if the project's
  copy diverged meaningfully).
- **`.harness/status.json` — PRESERVE, don't reset.** If absent, seed the three checks (`audit`, `structure`,
  `cleanup`) from the template and tune `everyDays` per project. If it **already exists**, keep each check's
  `lastRun` and any tuned `everyDays`/`note`, and only **add checks that are missing** — a blind copy would
  reset every maintenance clock to "never run" and immediately nag.
- The template `.claude/settings.json` already wires a `SessionStart` hook that runs
  `scripts/harness-check.mjs --hook`, so overdue checks surface in Claude's context each session.
- Add `"harness:check": "node scripts/harness-check.mjs"` to `package.json` scripts.
- Commit `.harness/status.json` (it is shared project state); `scripts/` and `.harness/` are NOT gitignored.
- How it runs: `audit` → `/harness-audit`; `structure`/`cleanup` → the same-named subagents. Each writes a
  short report and stamps the ledger. See the CLAUDE.md "Harness health" section.

## 4. CLAUDE.md

- If absent, copy the template `CLAUDE.md` and fill the project-specific section (stack, how to run locally,
  generated files, project-specific gates). If present, reconcile — don't clobber.

## 5. CI & dependencies

- Add a thin CI caller referencing the reusable workflow:
  ```yaml
  name: CI
  on: pull_request
  jobs:
    ci:
      uses: TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml@v1
      with: { postgres: false, web-dir: '' }   # set per project
      secrets: inherit
  ```
- **Dependencies — quiet by default:** enable Dependabot *security* updates only
  (`gh api -X PUT repos/OWNER/REPO/automated-security-fixes`) — vulnerability fixes, no routine
  bump-PR/email stream. Do **not** add a version-update `dependabot.yml` unless the user explicitly
  wants routine bumps (then copy `templates/dependabot.optin.yml`).
- Mention the one manual step: set GitHub → Settings → Notifications → Actions to "failed only" to
  avoid green-run email noise.

## 6. Verify, don't assume

- Run the local gates (`lint`, typecheck, tests) and report the result. Note anything that needs the user
  (e.g. a `.npmrc` with a GitHub Packages token to install the private shared configs).
- Summarize what you **added**, what you **reconciled/merged**, and any **deviations** found in an existing
  harness that need a human decision. On an already-adopted project a re-run should converge to "nothing to
  change" (plus that report). Do not commit unless asked.
