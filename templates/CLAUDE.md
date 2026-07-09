# CLAUDE.md — working conventions (TecNET-systems-GmbH base)

Base conventions for any TypeScript/Node project. Copy into a project and append a project-specific
section (stack, modules, how to run locally). Agents AND humans read this.

## Gates — run before committing (uniform across all projects)

- `npm run check` — `tsc --noEmit` (types). Must be clean.
- `npm run lint` — ESLint (shared config).
- `npm run format:check` — Prettier.
- `npm test` — tests. Categorized runs where available: `npm run test:api`, `test:web`, `test:security`.
- Project-specific drift/generated guards (e.g. `npm run gen:prisma:check`) if present.

CI runs these on every pull request and reports a status per gate.

## Agent self-verification loop (important)

After making changes:
1. Run the relevant local gate(s) above.
2. After pushing / opening a PR, read CI status and act on it:
   - `gh pr checks <number>` — per-gate pass/fail.
   - `gh run view <run-id> --log-failed` — the failing step's log.
   - Fix, re-push, repeat until green.

Do not consider work done until the gates (local + CI) are green.

## Code standards

- **Language: English** for code, comments, commit messages, tickets, docs. **Domain vocabulary stays
  in the domain language** (UI labels, enum values, user-facing strings, domain nouns) — do not translate those.
- **File length:** aim < 500 lines (`max-lines` warns at 500). Split rather than add new large files.
- **Never edit generated files** (list them in the project section, e.g. `src/generated/**`). Edit the source + regenerate.
- Match the surrounding style; formatting is enforced by Prettier (shared config) via the pre-commit hook.

## Commits & branches

- Conventional Commits: `feat | fix | refactor | test | docs | build | chore`.
- Multi-line messages via `git commit -F` / heredoc.
- AI-authored commits end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Prefer PR-based changes; each commit should keep the gates green.

## Tickets / issues (when the agent structures work)

- One uniform template: title (Conventional-Commit-style scope), problem, proposed approach, acceptance
  criteria, labels. English.
- Break large work into structured sub-issues. **Propose the breakdown for human approval before
  mass-creating issues** — avoid ticket spam.

## Project-specific section (fill in per project)

- Stack / how to run locally (dev server, DB).
- Generated files that must never be hand-edited.
- Any project-specific gates and their meaning.
