---
description: Audit this project's test structure, coverage categories, and CI wiring; recommend concrete improvements.
allowed-tools: Read, Glob, Grep, Bash
---

You are auditing this repository's **testing & quality setup**. Do not change code. Produce a report and a
prioritized, human-approvable action list. Base every claim on files you actually read — no guessing.

## 0. Severity philosophy — separate defects from capabilities, calibrate by phase

Every finding falls into one of two buckets; treat them very differently:

- **Security correctness defects (code)** — wrong regardless of phase, scale, or whether data is real:
  a secret with a silent insecure fallback, authorization not enforced (deny-by-default violated), trusting
  client-supplied identity/roles, a missing auth check, unsanitized input / injection, committed secrets,
  stack traces / internals leaked to clients. **Escalate these (P1) and recommend fixing now** — they are
  cheap, phase-independent, and simply bugs.

- **Compliance & operational capabilities (process)** — audit-logging depth, data retention /
  right-to-erasure, PII-access logging, rate limiting, monitoring/alerting. These depend on **phase** and
  usually need a **human/business decision** (e.g. erasure must respect outstanding payments and legal
  retention — do NOT propose auto-building it). Present these as a **backlog of pre-production decisions**,
  not as "fix now". Flag the ones needing a human decision, and **warn against premature abstraction** —
  recommending a generic mechanism before the requirements are concrete is itself the boilerplate we avoid.

**First establish the phase**: early dev with test data / pre-production / live with real (personal) data.
A gap that is P1 in production may be backlog in early development. If it isn't obvious from the repo, ask.

## 0b. Deduplicate against what's already tracked — don't re-nag

An audit is *visibility*, not a mandate, and it must not re-raise the same gaps every time it runs.

- Before reporting, check what's **already tracked**: open/closed issues (especially a `deferred` or
  `backlog` label — `gh issue list --state all --label deferred` if `gh` is available), plus any known-gaps
  notes in the repo.
- **Only surface**: (a) genuinely **new** findings, or (b) an already-tracked one whose **phase now makes it
  actionable** (e.g. the project just went live with real data) — and then say *why it's now relevant*.
- **Never re-recommend a consciously `deferred` finding** — treat it as a settled decision, not an open
  question to re-litigate.
- Run this audit **deliberately** (before a release, on a phase change, on request) — not every planning turn.

## 1. Inventory (read the repo)

- Detect the stack, test runner(s), and how tests are invoked (`package.json` scripts, config files).
- Locate the tests. Report: how many, where they live, and the naming/structure convention.
- Map tests to the code they cover. Which subsystems/modules have tests and which have **none**?

## 2. Structure & quality

- Are tests **structured** (clear arrange/act/assert, isolated, deterministic) or ad-hoc?
- Do any tests hit real external state (DB, network, filesystem)? Are those clearly separated from unit tests
  and set up reproducibly (fixtures/seed), so they can run in CI?
- Are there fast unit tests vs. slow integration tests, and can they be run separately?

## 3. Category gaps (the important part)

Assess whether each category exists and is warranted for **this** project — recommend, don't assume:

- **API / contract tests** — for HTTP/RPC surfaces: are request/response shapes and error paths covered?
- **Security & permission / authorization tests** — are access-control rules (roles, ownership, tenant
  isolation) actually asserted? Missing authz tests are a common high-severity gap.
- **Input validation / boundary tests** — untrusted input, edge values.
- **End-to-end (Playwright)** — judge honestly: does this project have real user-facing UI flows that
  regress often? If yes, recommend Playwright and name 2-3 concrete flows worth covering. If it's a
  backend/library with no meaningful UI, say E2E is **not** warranted and why. Do not cargo-cult it.

## 3b. Security & compliance baseline (runtime controls, not just tests)

Check the project against `SECURITY-baseline.md` (in the repo, or the dev-standards template). These are
things tooling cannot create — only detect the absence of. For each, report present / partial / missing:

- **Secrets**: real `.env` gitignored, `.env.example` tracked, env validated at boot, secret scanning wired.
- **Auth/sessions**: idle auto-logout + absolute session lifetime, secure/httpOnly/sameSite cookies,
  account lockout after repeated failed logins.
- **Authorization**: deny-by-default, ownership/tenant checks.
- **Audit logging**: mutations + admin actions logged, and **security events** (failed logins, authz
  denials, exports) logged. Flag if only happy-path actions are logged.
- **Resource limits**: rate limiting, max request body / upload size, pagination caps.
- **HTTP hardening**: HTTPS/HSTS, security headers (helmet/CSP).
- **Error hygiene**: no stack traces / internals leaked to clients.
- **DSGVO/GDPR**: for personal data (names, salaries, IBANs, contact data) — retention/deletion concept,
  authorized + audit-logged access. Treat these as compliance obligations, not optional.

Grep for evidence (middleware names, cookie options, rate-limit/helmet imports, audit-log calls on failure
paths) rather than assuming. Classify each finding per §0: **code defects** here (e.g. deny-by-default not
enforced, a trusted client-supplied role header, a silent secret fallback, leaked internals) are P1 and
fixed now. **Compliance/process items** (audit-logging depth, DSGVO retention/erasure, PII-access logging)
are calibrated by phase: urgent only once the project is **live with real personal data**; in early dev with
test data, record them as pre-production backlog with the human-decision caveat — do NOT mark them P1 or
propose a speculative generic mechanism.

## 4. CI wiring

- Which of the above run in CI today? Recommend how to wire the missing-but-warranted ones, ideally as
  categorized scripts (`test:api`, `test:security`, `test:web`) so CI can report per category.

## 5. Output

Produce:
1. A short **verdict** (1-2 sentences): is the test setup solid, adequate, or weak? State the detected phase.
2. A **table**: category → present? → quality → recommendation.
3. A **prioritized action list**, each item concrete and small enough to become one ticket, split into:
   - **Fix now** — security correctness defects + cheap test-coverage wins (§0 bucket 1).
   - **Pre-production backlog** — compliance/operational capabilities (§0 bucket 2), each tagged
     `needs human decision` where applicable, and with an explicit "don't build a generic mechanism yet"
     note where the requirements aren't concrete.

Exclude anything already tracked (per §0b); if you re-surface a `deferred` item because its phase changed,
say so explicitly. If nothing new is found, say so plainly — a short "no new findings" is a valid result.

Then ask whether to turn the "fix now" items into issues using the project's ticket template.
**Propose the breakdown first — do not mass-create issues without approval** (avoid ticket spam). For the
backlog items, recommend tracking (deferred issues), not building.

## Harness ledger

If the project uses the harness-health loop and this audit was run as the `audit` check (or you just want
to reset its clock), stamp it: `node scripts/harness-check.mjs --record audit "<one-line verdict>"`, then
commit `.harness/status.json`. That silences the "audit overdue" reminder until the next cadence.
