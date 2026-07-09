---
description: Audit this project's test structure, coverage categories, and CI wiring; recommend concrete improvements.
allowed-tools: Read, Glob, Grep, Bash
---

You are auditing this repository's **testing & quality setup**. Do not change code. Produce a report and a
prioritized, human-approvable action list. Base every claim on files you actually read — no guessing.

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
paths) rather than assuming. If personal data is present, escalate missing audit-logging / deletion concept
to P1.

## 4. CI wiring

- Which of the above run in CI today? Recommend how to wire the missing-but-warranted ones, ideally as
  categorized scripts (`test:api`, `test:security`, `test:web`) so CI can report per category.

## 5. Output

Produce:
1. A short **verdict** (1-2 sentences): is the test setup solid, adequate, or weak?
2. A **table**: category → present? → quality → recommendation.
3. A **prioritized action list** (P1/P2/P3), each item concrete and small enough to become one ticket.

Then ask whether to turn the P1/P2 items into issues using the project's ticket template.
**Propose the breakdown first — do not mass-create issues without approval** (avoid ticket spam).
