# Security & compliance baseline

A checklist of the things that are **easy to forget** and expensive to add late. Not every item fits
every project — but every item should be a **conscious decision**, not an accidental omission. The
`/harness-audit` command checks a project against this list and reports gaps.

**Two kinds of items live here — treat them differently:**

- 🔧 **Correctness defect (code)** — wrong regardless of phase/scale/data. Fix now; it's a bug. Examples:
  silent insecure secret fallback, deny-by-default not enforced, trusting client-supplied roles, missing
  input validation, leaked internals.
- ⏳ **Capability (process)** — phase-dependent, often a human/business decision. Decide **before go-live
  with real data**; don't build a generic mechanism early (that's premature abstraction). Examples: audit
  depth, retention/erasure, rate limiting, monitoring.

Calibrate by **phase**: early dev with test data → 🔧 now, ⏳ tracked as backlog; live with real personal
data → ⏳ items become obligations. Severity: **[must]** / **[should]** / **[context]**.

## Secrets & configuration

- **[must]** Secrets only from the environment; never hard-coded, never committed. Real `.env` gitignored,
  only `.env.example` tracked. Enforced by secret scanning (secretlint) in pre-commit + CI.
- **[must]** Validate env at boot (see `env.ts`) — fail fast on missing/invalid config.
- **[should]** A leaked secret is compromised: **rotate it**, don't just rewrite git history.

## Authentication & sessions

- **[must]** Idle **auto-logout** (session timeout) and an absolute session lifetime.
- **[must]** Session cookies: `httpOnly`, `secure`, `sameSite`.
- **[must]** **Account lockout / backoff after N failed logins** (brute-force protection).
- **[should]** Password policy; MFA where the data sensitivity warrants it.

## Authorization  🔧 *(correctness — enforce now)*

- **[must]** **Deny-by-default**: every endpoint/action checks permission explicitly.
- **[must]** Ownership / tenant-isolation checks (a user cannot read/write another's records).
- **[should]** Authorization is covered by tests (see `/harness-audit` — a common high-severity gap).

## Audit logging  ⏳ *(capability — decide what to log & retention before go-live; don't auto-build early)*

- Log **who did what, when** for mutations and admin actions.
- Log **security events**: failed logins, authz denials, permission changes, exports.
- Logs are tamper-evident and retained per policy; no secrets/PII in log payloads.

## Abuse & resource limits  ⏳ *(hardening — pre-production)*

- **[should]** **Rate limiting / throttling** per IP / user / endpoint.
- **[should]** **Max request body size** and **max upload size**; validate file types.
- **[context]** Pagination caps on list endpoints (no unbounded queries).

## Transport & HTTP hardening

- **[must]** HTTPS everywhere; HSTS.
- **[should]** Security headers (`helmet`): CSP, `X-Content-Type-Options`, `X-Frame-Options`, referrer policy.

## Input / output  🔧 *(correctness — do now)*

- **[must]** Validate all untrusted input (schema validation, e.g. zod) at the boundary.
- **[must]** Parameterized queries / ORM (no string-built SQL) — output encoding to prevent XSS.
- **[should]** Error responses leak no stack traces or internal details; log details server-side only.

## Data protection & DSGVO/GDPR  ⏳ *(capability — legally binding once you hold real personal data)*

- Know what **personal data** you store (names, salaries, IBANs, contact data…) and why.
- **Retention & deletion concept** — data is erasable on request (right to erasure). **This is a
  human-judgment business process, not an automation**: erasure must respect outstanding obligations
  (e.g. pending salary payments) and legal retention periods. Build *tooling that supports a human
  decision*, not an auto-erase — and only once the requirements are concrete. Archive-first/`deleteMode`
  is a starting point, not erasure.
- Access to personal data is authorized and **audit-logged**.
- Encryption at rest for sensitive fields where warranted; documented backups.

## Dependencies & supply chain

- **[should]** Vulnerability scanning (`npm audit` in CI, Dependabot) — review high/critical promptly.
- **[should]** Lockfile committed; `npm ci` in CI.

---

> **Reading this for an HR/payroll app (salaries, IBANs):** the 🔧 items (Authorization, Input/output,
> Secrets) are correctness — fix them now regardless of phase. The ⏳ items (Audit depth, DSGVO
> retention/erasure) are obligations **before go-live with real data** — track them as pre-production
> decisions, decide the human-in-the-loop workflow then, and resist building a generic mechanism early.
