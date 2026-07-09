# dev-standards

Company-wide development harness & CI standards for TecNET-systems-GmbH (TypeScript/Node).
One central definition, referenced by every project — see [`docs/plan.md`](docs/plan.md) for the concept.

## What's here

| Path | Purpose |
|---|---|
| `packages/eslint-config` | `@tecnet-systems-gmbh/eslint-config` — shared ESLint 9 flat config (base + `/react`). |
| `packages/tsconfig` | `@tecnet-systems-gmbh/tsconfig` — shared strict `tsconfig` base. |
| `packages/prettier-config` | `@tecnet-systems-gmbh/prettier-config` — shared Prettier config. |
| `templates/` | Drop-in templates: `CLAUDE.md` (agent conventions), `dependabot.yml`. |
| `.github/workflows/node-ci.yml` | Reusable CI workflow (`workflow_call`) — projects reference it. |

## Using it in a project

`eslint.config.js`:
```js
import base from '@tecnet-systems-gmbh/eslint-config';        // or '/react' for web
export default [...base, { ignores: ['src/generated/**'] } /* project extras */];
```

`tsconfig.json`:
```json
{ "extends": "@tecnet-systems-gmbh/tsconfig/base.json", "compilerOptions": { "rootDir": "src", "outDir": "dist" }, "include": ["src"] }
```

`.prettierrc.json`: `"@tecnet-systems-gmbh/prettier-config"`

CI (`.github/workflows/ci.yml`):
```yaml
name: CI
on: pull_request
jobs:
  ci:
    uses: TecNET-systems-GmbH/dev-standards/.github/workflows/node-ci.yml@v1
    with: { postgres: true, web-build: true }
    secrets: inherit
```

## Status

MVP in progress (Phase 1). Packages are not yet published to GitHub Packages — publishing + the
`@tecnet-systems-gmbh/harness` CLI (init/doctor + gate commands) are the next steps.
