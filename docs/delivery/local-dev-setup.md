# Local Development Setup

## Node.js

Required:

* Node.js **22.23.0** (pinned in `.nvmrc`)

Recommended:

* nvm

Install:

```bash
nvm install    # reads .nvmrc
nvm use
```

Verify:

```bash
node --version
```

Expected:

```
v22.23.0
```

---

## Version Governance

**`.nvmrc` is the single source of truth** for the Node.js version used across PrintHub.

| Context | How the version is enforced |
|---|---|
| Local development | `nvm use` reads `.nvmrc` |
| CI (application Node) | `actions/setup-node@v6` uses `node-version-file: .nvmrc` |
| CI (action runtime) | `actions/checkout@v7` and `actions/setup-node@v6` run on GitHub's Node 24 JavaScript runtime |
| npm | `package.json` → `engines.node` matches `.nvmrc` exactly |
| Cursor agents | Must use the version in `.nvmrc` — see `.cursor/rules/node-version-governance.mdc` |

Contributors, CI, and automated agents must all run the same version. Do not develop or commit using a different Node major or patch.

When upgrading Node.js, update `.nvmrc`, `engines.node`, documentation, and `@types/node` (if the major line changes) in the same change set.

---

## npm

Expected:

npm 10+

Verify:

```bash
npm --version
```

---

## First-time setup

```bash
npm install
```

---

## Useful commands

```bash
npm run dev
npm run build
npm run build:profiles
npm run typecheck
npm run test
npm run test:e2e
npm run migrate:feedback-to-sqlite
```

---

## Common Issues

### Wrong Node version

Symptoms:

* Vite fails to start
* Vitest ESM errors
* npm engine warnings

Cause:

PrintHub requires Node **22.23.0**. Older versions (16, 18) or newer majors (24+) are not supported.

Fix:

```bash
nvm install
nvm use
node --version   # expect v22.23.0
```

### Playwright browsers missing

Run:

```bash
npx playwright install
```

### Generated profiles missing

Run:

```bash
npm run build:profiles
```

before:

```bash
npm run build
```

---

## Environment

No environment variables required for MVP.

### Feedback storage (optional)

Feedback persistence defaults to a JSON file. SQLite is available as an opt-in backend.

| Variable | Values | Default | Purpose |
|---|---|---|---|
| `FEEDBACK_STORE` | `file`, `sqlite` | `file` | Select feedback repository backend |
| `FEEDBACK_STORE_PATH` | path | `data/feedback.json` | JSON file location (when `FEEDBACK_STORE=file`) |
| `FEEDBACK_SQLITE_PATH` | path | `data/feedback.db` | SQLite database location (when `FEEDBACK_STORE=sqlite`) |

**SQLite is an implementation detail behind FeedbackRepository.** API handlers and analytics depend on the interface only.

Run the API with SQLite:

```bash
FEEDBACK_STORE=sqlite npm run dev:server
```

Migrate existing JSON feedback records to SQLite (idempotent, safe to rerun):

```bash
npm run migrate:feedback-to-sqlite
```

Then set `FEEDBACK_STORE=sqlite` to use the migrated database.
