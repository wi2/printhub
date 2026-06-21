# PrintHub Architecture Overview

Technical architecture reference for maintainers. Engineering milestones M1–M5 are complete; physical validation and launch sign-off remain (see [ADR-003](../decisions/adr-003-deferred-physical-validation.md)).

---

## 1. High-Level Purpose

PrintHub helps users find reliable 3D-printing profiles for popular printers. A user selects printer, material, nozzle size, and printing goal; the app resolves that combination against a pre-built manifest and delivers a validated slicer profile with import instructions and a feedback loop.

The system separates **build-time profile generation** (layered YAML → resolved parameters → serialized files) from **runtime consumption** (static SPA + lightweight feedback API). Profiles are never generated on demand at runtime — they are produced by the build pipeline and served as static assets.

---

## 2. End-to-End Generation Flow

### User journey (runtime)

```
Home (/)
  → Configure (/configure)
  → Profile (/profile/:slug)
  → Download → Import guide → Feedback
```

1. **User selects printer / material / nozzle / goal** — `CombinationForm` owns all four inputs. Selections can be pre-filled from URL query params (`?printer=…&material=…`).

2. **Combination lookup** — As the user selects inputs, `availability.ts` loads `combinations.json` once and checks which combinations exist with `isAvailable: true`. Unavailable materials are disabled; unavailable nozzle combinations show an inline message.

3. **Manifest resolution** — On submit, the form builds a deterministic slug (`[printer]-[material]-[nozzle]-[goal]`, e.g. `bambu-a1-mini-pla-04mm-balanced`) and verifies the combination exists in the manifest before navigating.

4. **Profile download** — `ProfilePage` loads the manifest entry by slug. `DownloadButton` serves the pre-generated file from `/profiles/prusaslicer/[slug].ini` or `/profiles/bambu-orca/[slug].3mf`, depending on printer.

5. **Import guide** — After the first download, `ImportGuide` reveals slicer-specific import steps (PrusaSlicer vs Bambu Orca).

6. **Feedback collection** — `FeedbackPrompt` is visible on page load. The user reports success, failure (with preset reasons), or pending. Submissions POST to `/api/feedback` and are persisted to a JSON file store.

### Build-time flow (profile engine)

Profiles are generated before deployment via `npm run build:profiles`. See §5 for the full pipeline.

---

## 3. Profile Engine Architecture

The engine lives under `scripts/` and `layers/`. It has no runtime dependency on the React frontend except shared domain types in `src/types.ts`.

### Layer files (`layers/`)

YAML files that define slicer-agnostic parameters at increasing specificity:

| Directory | Purpose | Examples |
|---|---|---|
| `global-defaults.yaml` | Conservative fallbacks for all 34 parameters | Default speeds, temps, geometry |
| `printers/` | Hardware characteristics and balanced speeds | `bambu-a1-mini.yaml`, `prusa-mk4.yaml` |
| `materials/` | Temperatures, cooling, retraction | `pla.yaml`, `petg.yaml` |
| `goals/` | Quality/performance modifiers | `balanced.yaml`, `quality.yaml` |
| `nozzles/` | Nozzle geometry and volumetric limits | `0.4mm.yaml`, `0.6mm.yaml` |
| `overrides/` | Per-combination overrides (optional) | `[slug].yaml` |
| `guardrails.yaml` | Safety bounds (not merged into profiles) | Min/max for temps and speeds |

Layer ownership decisions are documented in [ADR-002](../decisions/adr-002-layer-ownership.md).

### Resolver (`scripts/engine/resolve.ts`)

Pure function. Accepts an ordered array of `LayerSchema` objects and merges them with `Object.assign` — later layers win on conflict. No file I/O.

Resolution order:

```
global defaults → printer → material → goal → nozzle → combination override
```

### Validator (`scripts/engine/validate.ts`)

Pure function. Checks four guarded parameters against bounds from `guardrails.yaml`:

- `nozzleTemp`, `bedTemp`, `printSpeed`, `firstLayerSpeed`

Returns `{ valid: true }` or `{ valid: false, violations }`. Combinations that fail validation are skipped during build (logged, not fatal).

### Serializers (`scripts/serializers/`)

Translate canonical JSON profiles into slicer-native formats. Serializers consume `CanonicalProfile` (defined in `scripts/schema/canonical-profile.ts`), not raw resolver output.

| Serializer | Output | Printers |
|---|---|---|
| `prusaslicer.ts` | `.ini` config bundle | Prusa MK4, Creality Ender 3 V3 SE |
| `bambu-orca.ts` | `.3mf` archive | Bambu A1 Mini, Bambu X1 Carbon, Creality K1 |

Each serializer maps internal parameter names to slicer-specific keys and hardcodes invariant fields required for valid import. Cross-material values (e.g. filament density) are sourced from `scripts/material-properties.ts`, not hardcoded in individual serializers.

**M6 serializer scope:** Serializers read resolved parameter values directly. Parameters such as `motionSystem` are present in resolved profiles but are not used for kinematic branching at launch — see [parameter-schema.md](../architecture/parameter-schema.md).

### Build pipeline (`scripts/build.ts`)

Orchestrates the full generation run:

1. Load shared layers (`global-defaults.yaml`, `guardrails.yaml`)
2. For each launch combination (20 at MVP): load printer, material, goal, nozzle, and optional override layers
3. Resolve → validate → build canonical JSON profile → serialize
4. Write profile files to `generated/profiles/` (JSON + slicer-native). Filenames and manifest slugs come from `canonical.metadata.slug`, constructed via the shared `src/lib/slug.ts` utility.
5. Write `generated/combinations.json` manifest (slug, metadata, download path, highlights)
6. Copy artifacts to `public/` via `publish-generated.ts` for Vite dev and production builds

Triggered by `npm run build:profiles` and automatically before `npm run build` via the `prebuild` hook.

---

## 4. Layer Hierarchy

Parameters inherit from broadest to most specific. When two layers set the same key, the more specific layer wins.

```
Global Defaults
        ↓
     Printer
        ↓
     Material
        ↓
       Goal
        ↓
      Nozzle
        ↓
Combination Override
        ↓
  Resolved Profile
```

At MVP, the Balanced goal does not override printer-layer speeds — each printer runs at its authored balanced speed (see ADR-002). The Quality goal explicitly overrides `printSpeed` and `firstLayerSpeed`.

---

## 5. Build Pipeline

```
Load Layers
        ↓
Resolve Parameters
        ↓
Validate Guardrails
        ↓
Build Canonical JSON Profile
        ↓
Serialize Profile (.ini / .3mf)
        ↓
Generate Manifest
        ↓
Frontend Consumption
```

**Outputs:**

```
generated/
  combinations.json          ← manifest (slug, metadata, downloadPath, highlights)
  profiles/
    [slug].json              ← canonical JSON profile (slicer-agnostic, build artifact)
    prusaslicer/[slug].ini
    bambu-orca/[slug].3mf

public/                      ← copied from generated/ for Vite
  combinations.json
  profiles/…
```

The frontend never runs the engine. It reads the manifest and serves static profile files from `public/`.

---

## 6. Runtime Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CDN / static host                                      │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ React SPA       │  │ Static generated profiles    │  │
│  │ (Vite / dist/)  │  │ combinations.json            │  │
│  │                 │  │ profiles/prusaslicer/*.ini   │  │
│  │ /               │  │ profiles/bambu-orca/*.3mf    │  │
│  │ /configure      │  └──────────────────────────────┘  │
│  │ /profile/:slug  │                                    │
│  └────────┬────────┘                                    │
└───────────┼─────────────────────────────────────────────┘
            │ POST /api/feedback
            ▼
┌─────────────────────────────────────────────────────────┐
│  Feedback API (Node.js, server/index.ts)                │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Rate limiter    │  │ JSON feedback store          │  │
│  │ (5 req/min/IP)  │  │ data/feedback.json           │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### React frontend

- **Stack:** React 19, TypeScript, Vite, React Router
- **Rendering:** Client-side only (CSR) — see ADR-001
- **Routes:** `/` (home), `/configure` (combination form), `/profile/:slug` (result page)
- **State:** Local component state only; no global store. The URL is the source of truth for the current combination.
- **Manifest loading:** Plain `fetch` with module-level cache in `availability.ts` — not React Query

Local development runs Vite and the API server concurrently via `npm run dev` (`scripts/dev.ts`).

### Static generated profiles

Served from `public/` after `build:profiles`. The manifest is the single source of truth for which combinations are available and where to download each profile.

### Feedback API

- **Endpoint:** `POST /api/feedback`
- **Validation:** Input schema check, manifest slug lookup, rate limiting
- **Payload:** `{ slug, outcome, failureReasons? }` where outcome is `success`, `failure`, or `pending`
- **Response:** `{ ok: true }` on success

### JSON feedback store

- **Location:** `data/feedback.json` (configurable via `FEEDBACK_STORE_PATH`)
- **Implementation:** Append-only JSON file (`server/store.ts`)
- **Rationale:** Zero dependency overhead at MVP launch volume; swap for SQLite or Postgres when query volume or concurrent writes require it

The stats endpoint (`GET /api/profile/:slug/stats`) and confidence count UI are deferred post-launch. Profile pages show a static placeholder: "New profile — be the first to report results."

---

## 7. Key Design Decisions

| Decision | Rationale | Reference |
|---|---|---|
| **CSR with Vite** | No SSG framework migration needed for M3; SEO delta immaterial at 20 combinations. Pure static SPA deployable to CDN. | [ADR-001](../decisions/adr-001-rendering-strategy.md) |
| **Layered parameter system** | Separates concerns by domain (hardware, material, goal, nozzle); enables per-printer balanced speeds without per-combination authoring | [ADR-002](../decisions/adr-002-layer-ownership.md) |
| **Pre-generated profiles** | Profiles are build-time artifacts, not runtime computations. Deterministic, auditable, and safe to cache on CDN. | `scripts/build.ts` |
| **Guardrail validation** | Four critical parameters checked against material/printer-specific bounds before a combination enters the manifest. Failed combinations are skipped, not shipped. | `scripts/engine/validate.ts` |
| **Deferred physical validation** | M5 engineering is complete; launch profiles pass automated validation only (`THEORETICALLY_VALID`). Real-hardware test prints (`PHYSICALLY_VALIDATED`) are deferred until printer access is available. | [ADR-003](../decisions/adr-003-deferred-physical-validation.md) |
| **No database for MVP** | Manifest is a static JSON file; feedback is a JSON file store. No Postgres, SQLite, or Redis at launch. | `server/store.ts` |
| **JSON as canonical profile format** | A typed JSON document sits between the resolver output and the serializers (M6). Serializers consume `CanonicalProfile`; slicer-native formats are outputs only. Enables V2+ versioning, feedback linkage, and optimization. | [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [canonical-profile-model.md](../architecture/canonical-profile-model.md) |

---

## 8. Known Limitations

| Limitation | Impact | Mitigation path |
|---|---|---|
| **File-based feedback storage** | No concurrent write safety at scale; no query API for analytics | Swap `createFileFeedbackStore` for SQLite when volume requires it |
| **Quality goal not yet available** | Only Balanced goal is in the launch manifest (20 combinations). Quality layer exists but is not built or validated. | Add to build list after physical validation |
| **Physical validation deferred** | Engineering is complete (M1–M5); all 20 launch combinations are `THEORETICALLY_VALID` only. Launch is blocked until physical test prints pass (PV-1, PV-2; originally S-5.4, S-5.5) | [ADR-003](../decisions/adr-003-deferred-physical-validation.md), [combination-validation-runbook.md](./combination-validation-runbook.md) |
| **CSR — no SEO on profile pages** | Profile content not in initial HTML; search engines that do not execute JS will not index highlights | Revisit SSG (e.g. `vite-ssg`) before Phase 1 scale |
| **Static confidence count** | Stats API deferred; all profiles show "be the first to report results" | Wire `GET /api/profile/:slug/stats` post-launch |
| **Guardrail scope** | Only four parameters validated; other settings rely on layer authoring discipline | Expand guarded params in Phase 1 if needed |

---

## 9. Roadmap Awareness

This document describes the V1 (MVP) architecture. The following planned changes are documented separately and do not affect any code in this version:

| Phase | Change | Reference |
|---|---|---|
| **V2** | `ProfileVersion` records persisted to SQLite; feedback store migrated; feedback-to-version linkage | [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [future-architecture.md](../architecture/future-architecture.md) |
| **V2–V3** | Stats API (`GET /api/profile/:slug/stats`) implemented; confidence scoring added to `ProfilePage` | [backlog.md V3 stories](./backlog.md) |
| **V4–V5** | Parameter comparison, rule-based suggestions, AI recommendation pipeline — all with mandatory human review | [roadmap-v2-v5.md](./roadmap-v2-v5.md) |

For the entity model that underpins V2+, see [future-data-model.md](./future-data-model.md). For the full architecture evolution diagram, see [future-architecture.md](../architecture/future-architecture.md).

---

## Related Documentation

| Document | Purpose |
|---|---|
| [local-dev-setup.md](./local-dev-setup.md) | Node version, install, common issues |
| [deployment-runbook.md](./deployment-runbook.md) | Production deploy, smoke tests, rollback |
| [combination-validation-runbook.md](./combination-validation-runbook.md) | Physical validation before launch |
| [epic-mvp.md](./epic-mvp.md) | Story scope and acceptance criteria |
| [ADR-001](../decisions/adr-001-rendering-strategy.md) | CSR vs SSG decision |
| [ADR-002](../decisions/adr-002-layer-ownership.md) | Parameter ownership by layer type |
| [ADR-003](../decisions/adr-003-deferred-physical-validation.md) | Engineering vs physical validation; launch readiness |
| [README.md](../../README.md) | Project overview and commands |
