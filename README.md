# PrintHub

Generate validated 3D-printing profiles for popular printers in a few clicks.

PrintHub combines a layered profile engine, safety guardrails, and pre-generated slicer profiles to help users quickly find reliable settings for their printer, material, nozzle size, and printing goal.

---

## MVP Scope

Supported printers:

* Bambu A1 Mini
* Bambu X1 Carbon
* Prusa MK4
* Creality Ender 3 V3 SE
* Creality K1

Supported materials:

* PLA
* PETG

Supported nozzle sizes:

* 0.4 mm
* 0.6 mm

Supported goals:

* Balanced

---

## Tech Stack

Frontend:

* React 19
* TypeScript
* Vite
* React Router

Testing:

* Vitest
* Testing Library
* Playwright
* MSW

Build tools:

* tsx
* YAML layer system

CI:

* GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v6`; application Node from `.nvmrc`)

---

## Project Structure

```
src/          React frontend
scripts/      Profile engine and build pipeline
layers/       Authored YAML parameter layers
generated/    Build output (gitignored)
public/       Static assets copied from generated/
server/       Feedback API
tests/        E2E and integration tests
docs/         Architecture, decisions, and runbooks
```

---

## Installation

### Requirements

* Node.js **22.23.0** (see `.nvmrc` — single source of truth)
* npm 10+

Local development, CI, and Cursor agent work must all use the version in `.nvmrc`. See [Version Governance](docs/delivery/local-dev-setup.md#version-governance) in the local dev guide.

See [local-dev-setup.md](docs/delivery/local-dev-setup.md) for first-time setup.

### Clone

```bash
git clone <repository-url>
cd printhub
```

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Starts Vite (frontend) and the feedback API concurrently.

### Run tests

```bash
npm run test
```

### Run E2E tests

```bash
npm run test:e2e
```

### Type checking

```bash
npm run typecheck
```

### Build generated profiles

```bash
npm run build:profiles
```

### Build application

```bash
npm run build
```

---

## Profile Generation Pipeline

1. Load layer files
2. Resolve parameters
3. Validate guardrails
4. Build canonical JSON profile
5. Serialize profile (`.ini` / `.3mf`)
6. Generate manifest
7. Build application

Canonical JSON profiles are written to `generated/profiles/[slug].json` at build time. They are not served to users at M6 — see [canonical-profile-model.md](docs/architecture/canonical-profile-model.md).

---

## Documentation

| Document | Purpose |
|---|---|
| [ADR-003](docs/decisions/adr-003-deferred-physical-validation.md) | Engineering vs physical validation; launch readiness |
| [Combination validation runbook](docs/delivery/combination-validation-runbook.md) | Physical test procedure before launch |
| [Deployment runbook](docs/delivery/deployment-runbook.md) | Production deploy steps |
| [Architecture overview](docs/delivery/architecture-overview.md) | System design and known MVP limitations |
| [Canonical profile model](docs/architecture/canonical-profile-model.md) | Canonical JSON schema and build pipeline (M6) |
| [Local dev setup](docs/delivery/local-dev-setup.md) | Environment and common issues |

---

## Current Status

M1 — Foundation ✅

M2 — Profile Engine ✅

M3 — Frontend ✅

M4 — Runtime API ✅

M5 — Launch Gate ⏳

M6 — Canonical JSON Foundation ✅

**Physical validation:** Deferred per [ADR-003](docs/decisions/adr-003-deferred-physical-validation.md). All 20 launch combinations are `THEORETICALLY_VALID` (engineering validation only). Real-hardware test prints (PV-1, PV-2) must complete before launch sign-off.

**Pending:**

* Physical printer validation — follow [combination-validation-runbook.md](docs/delivery/combination-validation-runbook.md)
* Launch checklist sign-off (S-5.6)

---

## MVP Limitations

* Balanced goal only at launch (Quality deferred)
* Static confidence message — stats API deferred post-launch
* No slicer override UI — format derived from printer
* File-based feedback storage — not suitable for high concurrent write volume
* CSR only — profile pages not pre-rendered for SEO

Full list: [architecture-overview.md §8](docs/delivery/architecture-overview.md#8-known-limitations)

---

## License

Private project.
