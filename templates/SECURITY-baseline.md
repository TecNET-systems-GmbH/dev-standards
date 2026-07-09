# Security & compliance baseline

A checklist of the things that are **easy to forget** and expensive to add late. Not every item fits
every project — but every item should be a **conscious decision**, not an accidental omission. The
`/harness-audit` command checks a project against this list and reports gaps.

Marked severity: **[must]** = do it for any app handling real users/data · **[should]** = strongly
recommended · **[context]** = depends on the app.

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

## Authorization

- **[must]** **Deny-by-default**: every endpoint/action checks permission explicitly.
- **[must]** Ownership / tenant-isolation checks (a user cannot read/write another's records).
- **[should]** Authorization is covered by tests (see `/harness-audit` — a common high-severity gap).

## Audit logging  *(the commonly-forgotten one)*

- **[must]** Log **who did what, when** for mutations and admin actions.
- **[must]** Log **security events**: failed logins, authz denials, permission changes, exports.
- **[should]** Logs are tamper-evident and retained per policy; no secrets/PII in log payloads.

## Abuse & resource limits

- **[should]** **Rate limiting / throttling** per IP / user / endpoint.
- **[should]** **Max request body size** and **max upload size**; validate file types.
- **[context]** Pagination caps on list endpoints (no unbounded queries).

## Transport & HTTP hardening

- **[must]** HTTPS everywhere; HSTS.
- **[should]** Security headers (`helmet`): CSP, `X-Content-Type-Options`, `X-Frame-Options`, referrer policy.

## Input / output

- **[must]** Validate all untrusted input (schema validation, e.g. zod) at the boundary.
- **[must]** Parameterized queries / ORM (no string-built SQL) — output encoding to prevent XSS.
- **[should]** Error responses leak no stack traces or internal details; log details server-side only.

## Data protection & DSGVO/GDPR  *(legally binding for personal data)*

- **[must]** Know what **personal data** you store (names, salaries, IBANs, contact data…) and why.
- **[must]** **Retention & deletion concept** — data is deletable/erasable on request (right to erasure);
  see an archive-first/`deleteMode` design if applicable.
- **[must]** Access to personal data is authorized and **audit-logged**.
- **[should]** Encryption at rest for sensitive fields where warranted; documented backups.

## Dependencies & supply chain

- **[should]** Vulnerability scanning (`npm audit` in CI, Dependabot) — review high/critical promptly.
- **[should]** Lockfile committed; `npm ci` in CI.

---

> **This project handles personal data (HR/payroll: salaries, IBANs).** The **[must]** items under
> Audit logging, Authorization, and DSGVO are compliance obligations, not nice-to-haves.
