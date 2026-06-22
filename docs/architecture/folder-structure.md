# Folder Structure — Slicer Profile Generator

**Version:** 1.1
**Status:** Revised — simplified after self-review
**Scope:** MVP (Phase 0) with forward compatibility to Phase 1–2
**Input documents:** `docs/discovery/`, `docs/architecture/`, `docs/decisions/discovery-review.md`

---

## Design Goals

Five goals guide every structural decision in this document. When a structural question arises during delivery, apply these criteria in order.

**1. Maintainability**
A contributor who understands the domain should be able to find any file without consulting a guide. A change to a single layer file should require touching one place.

**2. Scalability**
Adding a 6th printer at Phase 1 should add one file. Adding a new slicer format should add one serializer.

**3. Simplicity**
Every folder that exists must earn its place with a current benefit, not an anticipated one. Complexity is introduced when demonstrated necessary, not in advance.

**4. Clear ownership boundaries**
Build-time code (scripts, layers) and runtime code (src, server) must not be mixed. Authored data (layers/) and generated data (generated/) must be separate. Each module boundary must communicate who is responsible for what.

**5. Fast contributor onboarding**
A new contributor should be able to answer "where does X live?" within the folder tree alone.

---

## What changed from v1.0 and why

The first version of this document was reviewed and found to contain several structural decisions that were "forward-looking" rather than justified by current requirements. The following were removed or simplified:

| Removed / simplified | Reason |
|---|---|
| `src/app/` directory (App.tsx, router.tsx, providers.tsx) | Three files for ~40 lines of bootstrapping. Collapsed into `App.tsx` + `main.tsx`. |
| `src/pages/` + `src/features/` split | Two directories with zero cross-feature reuse at MVP. Collapsed: feature components live colocated inside their page directory. |
| `src/types/` split into three files | domain.ts / api.ts / manifest.ts — premature separation at MVP scale. One `types.ts` is sufficient. |
| `src/shared/layouts/` subdirectory | One file (`PageLayout.tsx`) does not warrant a subdirectory. Lives directly in `src/shared/`. |
| `src/lib/format.ts` | Speculative file. No formatting requirement exists in the spec. |
| `server/middleware/` subdirectory | Two files do not warrant a subdirectory. Middleware lives directly in `server/`. |
| `generated/manifests/` subdirectory | One file does not warrant a subdirectory. Flattened to `generated/combinations.json`. |
| Separate `tests/unit/` mirror tree | Unit tests for engine and serializers are colocated with their source files. Only E2E and integration tests live in `tests/`. |
| `tests/fixtures/` with three subdirectories | Flat fixture directory is sufficient at MVP scale. |
| `POST /api/generate` and `GET /api/profile/:slug/download` | Deferred. These routes exist primarily as analytics hooks. Client-side events cover the requirement at MVP. |
| `GET /api/profile/:slug/stats` | Deferred post-launch (Cut 2). Confidence count shows a static placeholder at MVP. |

---

## Project Structure

```
/
├── src/                     # React frontend (Vite)
├── server/                  # Node.js API server (runtime-only)
├── scripts/                 # Build-time tooling: engine, serializers, manifest
├── layers/                  # Profile engine input data — authored, version-controlled
├── generated/               # Engine output — gitignored
├── public/                  # Static assets
├── tests/                   # E2E and integration tests
├── docs/                    # Project documentation
│
├── package.json
├── tsconfig.json            # Frontend TypeScript config
├── tsconfig.node.json       # TypeScript config for scripts/ and server/
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── .gitignore               # generated/ is listed here
```

### Boundary rules

| Directory | Runtime? | Authored? | Gitignored? |
|---|---|---|---|
| `src/` | Yes | Yes | No |
| `server/` | Yes | Yes | No |
| `scripts/` | No — build-time only | Yes | No |
| `layers/` | No — build-time only | Yes | No |
| `generated/` | No | No — produced by scripts | **Yes** |
| `public/` | Yes — CDN-served | Yes | No |
| `tests/` | No | Yes | No |
| `docs/` | No | Yes | No |

`generated/` is the only output directory. Nothing inside it is ever edited by hand. If a generated profile file is wrong, the fix is made in `layers/` or `scripts/`, and the output is rebuilt.

---

## Frontend Organization

```
src/
├── pages/
│   ├── home/
│   │   └── HomePage.tsx
│   │
│   ├── configure/
│   │   ├── ConfigurePage.tsx        # Thin route wrapper; delegates to CombinationForm
│   │   ├── CombinationForm.tsx      # Orchestrates the 4 inputs; owns form state
│   │   ├── PrinterSelector.tsx
│   │   ├── MaterialSelector.tsx
│   │   ├── NozzleSelector.tsx
│   │   ├── GoalSelector.tsx
│   │   └── availability.ts          # No UI — isAvailable(p,m,n,g) → boolean
│   │
│   └── profile/
│       ├── ProfilePage.tsx           # Thin route wrapper; loads manifest entry by slug
│       ├── ProfileCard.tsx
│       ├── DownloadButton.tsx
│       ├── ImportGuide.tsx
│       ├── FeedbackPrompt.tsx
│       └── importGuides.ts           # Slicer-specific import step copy
│
├── shared/
│   ├── SegmentedSelector.tsx
│   ├── SearchableDropdown.tsx
│   └── PageLayout.tsx
│
├── lib/
│   ├── manifest.ts                  # loadManifest, findManifestEntryBySlug, cache
│   ├── slug.ts                      # Combination slug encode / decode
│   └── url-params.ts                # Query param parsing for form pre-fill
│
├── styles/
│   └── global.css                   # Minimal global styles — typography, layout, buttons, cards
│
├── types.ts                         # All TypeScript types and domain constants
├── App.tsx                          # Router setup only
└── main.tsx                         # Vite entry point
```

### Page directory colocation

Feature components live inside their page directory. There is no separate `features/` directory. This is the right call at MVP because:

- Each feature module is used by exactly one page — there is no cross-page reuse
- A contributor navigates to one directory to understand one screen
- The page component (`ConfigurePage.tsx`) and its components (`CombinationForm.tsx`, etc.) are peers that change together

If Phase 1 introduces cross-page shared logic — for example, an account page that reuses the availability check — that logic moves to a shared location at that point. The refactor is mechanical: move a file, update an import. Anticipating the refactor now adds two directories and zero current value.

### Why each folder exists

**`src/pages/`**
One subdirectory per route. Each subdirectory contains the page component (thin route target) and its colocated feature components. Adding a new route means adding a new subdirectory here.

**`src/shared/`**
Design system primitives with no product logic. `SegmentedSelector` does not know it is displaying materials. `SearchableDropdown` does not know it is displaying printers. Domain labels are applied at the feature layer. `PageLayout.tsx` lives here directly — it is one file and does not warrant a subdirectory.

`PageLayout.tsx` owns global navigation (header links, footer quick links) and the page shell. Navigation contains no business logic — only route matching and active-state styling. Pages remain route-owned; profile breadcrumbs live in `ProfilePage.tsx` because they are page-specific context, not global chrome.

At Phase 1, if the shared component count grows, a `src/shared/ui/` subdirectory is the natural extraction. Not before.

**`src/lib/`**
Pure utilities with no React dependency. `manifest.ts` loads and caches `combinations.json` — used by `availability.ts` and `ProfilePage`. `slug.ts` is the canonical implementation of combination slug encoding and decoding — used by both the frontend and the engine scripts, so it lives outside `pages/` and outside `scripts/`. `url-params.ts` parses query parameters for the configure pre-fill contract.

There is no `src/hooks/` directory at MVP. Manifest loading does not need a hook; feedback submission is fire-and-forget in `FeedbackPrompt`. Add `src/hooks/` when a shared hook has a second consumer (e.g. post-launch stats).

No `format.ts`. No speculative utility files. Files are added here when they have a known caller.

**`src/types.ts`**
One file. All TypeScript types and supported value constants for the MVP. Splitting into `domain.ts` / `api.ts` / `manifest.ts` adds import path management overhead that is not justified by a team of one or two developers working on three pages. The split is the right call at Phase 1 when the file grows past ~150 lines or multiple contributors begin working on separate concerns. Until then, one file is faster to navigate and simpler to maintain.

**`src/App.tsx`**
Router configuration only. At MVP this is ~15 lines. It does not warrant decomposition into `router.tsx` and `providers.tsx`. When Phase 1 adds providers (e.g. TanStack Query for stats) or complex routing, the split is easy to make. Not before.

---

## Domain Organization

Domain entities are types in `src/types.ts`, not directories. At 60 combinations and three pages, six separate domain directories would be architectural ceremony.

The supported values for each entity — the five printer slugs, the three material slugs, the two nozzle sizes, the two goal slugs — live as typed constants in `src/types.ts` alongside their type definitions. This is the single location to consult for what values are valid at runtime.

Engine-internal types (the shape of a YAML layer file, the intermediate resolved parameter set) live in `scripts/engine/types.ts`. The frontend never needs to know the internal parameter representation — it consumes the manifest.

---

## Layer Organization

```
layers/
├── global-defaults.yaml
├── guardrails.yaml              # Safety bounds — not a parameter layer
│
├── printers/
│   ├── bambu-a1-mini.yaml
│   ├── bambu-x1c.yaml
│   ├── prusa-mk4.yaml
│   ├── creality-ender-3-v3-se.yaml
│   └── creality-k1.yaml
│
├── materials/
│   ├── pla.yaml
│   ├── petg.yaml
│   └── tpu.yaml
│
├── goals/
│   ├── balanced.yaml
│   └── quality.yaml
│
├── nozzles/
│   ├── 0.4mm.yaml
│   └── 0.6mm.yaml
│
└── overrides/
    (empty at MVP launch)
```

`guardrails.yaml` lives directly in `layers/` rather than in a `layers/guardrails/` subdirectory. It is one file. A subdirectory for one file adds navigation for no benefit. Its separation from the parameter layers is preserved — it is not merged with any layer file — but it does not need its own directory to achieve that.

### Naming conventions

**Printer filenames** use the canonical printer slug: `[manufacturer]-[model-series]-[variant].yaml`. The filename without `.yaml` is the source of the printer's `id` slug used throughout the system — manifest, URL paths, query parameters. If a printer's display name changes, the slug does not. Slug stability is a hard requirement enforced by the build script.

**Material filenames** use the material slug, lowercase: `pla.yaml`, `petg.yaml`, `tpu.yaml`.

**Goal filenames** match the goal slugs exactly: `balanced.yaml`, `quality.yaml`.

**Nozzle filenames** use the diameter with unit: `0.4mm.yaml`, `0.6mm.yaml`.

**Override filenames** use the full combination slug: `bambu-a1-mini-tpu-04mm-balanced.yaml`. Override files must only exist for genuine edge cases where the inherited parameter set produces an incorrect result. Overrides that restate inherited values are not overrides — they are noise and must not be committed.

### `layers/guardrails.yaml`

Not a parameter layer. Defines valid ranges for safety-critical parameters — nozzle temperature, bed temperature, print speed — per material and per printer. Applied as a validation pass after the full parameter set is resolved. A change to this file triggers a full rebuild and re-validation of all combinations. It must never be merged with any layer file. Its separation is a safety property.

---

## Profile Engine Organization

```
scripts/
├── engine/
│   ├── types.ts             # Engine-internal types: layer schema, resolved params
│   ├── resolve.ts           # Layer resolution algorithm
│   ├── resolve.test.ts      # Unit tests — colocated
│   ├── validate.ts          # Safety guardrail validation pass
│   └── validate.test.ts     # Unit tests — colocated
│
├── schema/                  # Canonical JSON profile model (M6, ADR-004)
│   ├── canonical-profile.ts       # CanonicalProfile types
│   ├── build-canonical-profile.ts # ResolvedParams → CanonicalProfile
│   ├── serialize-canonical-profile.ts
│   └── *.test.ts                  # Unit tests — colocated
│
├── serializers/
│   ├── prusaslicer.ts       # CanonicalProfile → PrusaSlicer .ini config bundle
│   ├── prusaslicer.test.ts  # Unit tests — colocated
│   ├── bambu-orca.ts        # CanonicalProfile → Bambu/Orca .3mf project template
│   └── bambu-orca.test.ts   # Unit tests — colocated
│
└── build.ts                 # Orchestrator: resolve → validate → canonical JSON → serialize → manifest
```

Unit tests for the engine are colocated with their source files, not mirrored in a separate `tests/unit/` directory tree. This is the right call because:

- The engine file and its test change together — they belong side by side
- Vitest supports colocated tests natively
- A contributor editing `resolve.ts` sees `resolve.test.ts` without navigating elsewhere

### Responsibilities

**`scripts/engine/resolve.ts`**
Layer resolution algorithm. Accepts a combination (printer ID, material ID, nozzle, goal) and returns a fully resolved, slicer-agnostic parameter map. Merges layers in order — global defaults → printer → material → goal → nozzle → override if present — with one rule: the most specific layer wins. Has no knowledge of slicer formats.

**`scripts/engine/validate.ts`**
Guardrail validation pass. Accepts a resolved parameter map and the bounds from `layers/guardrails.yaml`. Returns `{ valid: true }` or `{ valid: false, violations: Violation[] }`. Does not modify the parameter map. A combination that fails is rejected from the manifest.

This is the build gate for safety-critical parameters. It is a separate file specifically so it can be tested in isolation without running the full build pipeline. A monolithic `build.ts` would prevent that. The cost is one extra file; the benefit is independently testable safety logic.

**`scripts/build.ts`**
Orchestrator. Iterates over all combinations, calls `resolve.ts`, passes the result to `validate.ts`, builds a `CanonicalProfile`, writes JSON artifacts, and for passing combinations calls the appropriate serializer. Writes outputs to `generated/`. Records failures and reports them at the end. The build fails if any combination fails validation.

**`scripts/schema/`**
Canonical JSON profile model (M6). Defines the typed intermediate representation between resolver output and serializers. See [canonical-profile-model.md](./canonical-profile-model.md).

**`scripts/serializers/prusaslicer.ts`**
Maps a `CanonicalProfile` to PrusaSlicer `.ini` format. Knows nothing about any other slicer.

**`scripts/serializers/bambu-orca.ts`**
Maps a `CanonicalProfile` to Bambu/Orca `.3mf` format. Knows nothing about any other slicer.

**The serialization boundary is strictly enforced.** No slicer-specific key name or format detail appears outside these two files. When Bambu Studio updates its schema, only `bambu-orca.ts` changes.

---

## Generated Artifacts

```
generated/                        ← gitignored in its entirety
│
├── profiles/
│   ├── [slug].json          # Canonical JSON profile (slicer-agnostic, M6)
│   ├── prusaslicer/
│   │   ├── bambu-a1-mini-pla-04mm-balanced.ini
│   │   └── ...  (20 .ini files at launch)
│   └── bambu-orca/
│       ├── bambu-a1-mini-pla-04mm-balanced.3mf
│       └── ...  (20 .3mf files at launch)
│
└── combinations.json             # Flat — no manifests/ subdirectory
```

`combinations.json` lives directly in `generated/`. There is one manifest file. It does not warrant a `manifests/` subdirectory.

### What is generated vs. authored

| File | Authored or generated | Who produces it |
|---|---|---|
| Layer YAML files | Authored | Domain experts |
| `layers/guardrails.yaml` | Authored — deliberate review required | Domain experts |
| Profile `.ini` files | Generated | `scripts/serializers/prusaslicer.ts` |
| Profile `.3mf` files | Generated | `scripts/serializers/bambu-orca.ts` |
| Profile `.json` files | Generated | `scripts/schema/serialize-canonical-profile.ts` |
| `generated/combinations.json` | Generated | `scripts/build.ts` |
| Pre-rendered HTML | Generated | Vite SSG build |

No file in `generated/` is ever edited by hand. Direct edits are overwritten on the next build and create a silent discrepancy between source and output. `generated/` is listed in `.gitignore` and profile files are not committed to the repository.

---

## API Organization

The MVP requires one runtime API endpoint plus a health check. Everything else is a static file.

```
server/
├── feedback.ts              # POST /api/feedback
├── manifest.ts              # Slug lookup for feedback validation
├── rate-limit.ts            # Sliding-window rate limiter
├── store.ts                 # JSON file feedback store
├── validate-input.ts        # Input validation
└── index.ts                 # Entry point and route registration
```

`validate-input.ts` and any rate limiting logic live directly in `server/`. No `middleware/` subdirectory. Two shared utilities do not warrant a directory.

### Runtime API routes

**`GET /combinations.json`** — Static. Not a server route. Served from CDN. The frontend fetches it once on the configure page. Changing the manifest requires a build and deploy.

**`POST /api/feedback`** — Receives `{slug, outcome, failureReasons[]}`. Validates against manifest. Writes to feedback store. Returns `{ok}`. No authentication. Rate limiting applied (5 requests/minute/IP by default).

**`GET /health`** — Returns `ok`. Used for load balancer health checks.

**Deferred post-launch:** `GET /api/profile/:slug/stats` — confidence count UI shows a static placeholder at MVP.

### What was deferred

`POST /api/generate` and `GET /api/profile/:slug/download` were in the v1.0 proposal. Both exist primarily as server-side analytics hooks:

- `POST /api/generate` validates the combination server-side and records a generation event. But the client already has the manifest and can validate locally. The slug is deterministic. A client-side analytics event records the generation without a server round-trip.
- `GET /api/profile/:slug/download` proxies the CDN file and records a download event. The download button can link directly to the CDN URL; the download event can be a client-side analytics call.

At MVP, client-side analytics (a lightweight tool like Plausible or PostHog) covers both event types without additional server infrastructure. These routes are deferred to Phase 1 if server-side event recording becomes necessary (rate limiting, anti-abuse, server-authoritative analytics).

If the team prefers server-side analytics from day one, both routes are simple additions to `server/` — they do not affect the structure of anything else.

---

## State Management Strategy

### URL state — primary

The URL is the single source of truth for the current combination.

- `/profile/bambu-a1-mini-pla-04mm-balanced` — full combination in the slug
- `/configure?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced` — form pre-fill state

The URL query parameter contract for `/configure` is stable from day one: `printer`, `material`, `nozzle`, `goal`. Invalid values are silently ignored. External links from filament brand QR codes and community posts will depend on this contract — it must not change after launch.

### Local component state

| State | Owner | Notes |
|---|---|---|
| Form input values (4 fields) | `CombinationForm` | Initialized from URL params on mount |
| Slicer format | `CombinationForm` | Derived from printer; not user-overridable at MVP |
| `showImportGuide` | `ProfileCard` | Set on first download via `DownloadButton` callback |
| `feedbackOutcome` | `FeedbackPrompt` | Shows thank-you on submit |
| Failure reason selections | `FeedbackPrompt` | Submitted and cleared |
| Profile entry lookup | `ProfilePage` | Loads manifest, finds entry by slug |

None of these need sharing across components. None survive navigation.

### Async data — plain fetch only

No React Query / TanStack Query at MVP. The manifest is loaded via `lib/manifest.ts` with a module-level cache. Feedback is a fire-and-forget POST from `FeedbackPrompt`. The confidence count on profile pages is a static placeholder string.

### Zustand — not used at MVP

No global store. The conditions under which Zustand becomes appropriate: user account state shared across multiple pages (Phase 1), or a multi-route workflow requiring preserved state. Neither exists at MVP. If added in Phase 1, it lives in `src/stores/` and does not require changes to any MVP component.

---

## Testing Strategy

```
tests/
├── e2e/
│   ├── generate-profile.spec.ts
│   ├── feedback.spec.ts
│   ├── url-prefill.spec.ts
│   └── unavailable-combination.spec.ts
│
├── integration/
│   └── feedback.test.ts         # POST /api/feedback handler
│
└── fixtures/
    ├── combination.ts           # Valid and invalid combination inputs
    ├── layers.yaml              # Minimal fixture layer data
    └── manifest.json            # Test combinations manifest
```

Unit tests are colocated with their source files (in `scripts/engine/` and `scripts/serializers/`). They are not mirrored in a `tests/unit/` directory. Only tests that have no natural source home — E2E tests, integration tests for the API server — live in `tests/`.

`tests/fixtures/` is flat. Three fixture files do not warrant three subdirectories.

### Unit tests (Vitest, colocated)

**`scripts/engine/resolve.test.ts`** — Tests layer merge order using minimal fixture layer objects. Asserts that the most specific layer overrides broader ones. Tests fall-through to global defaults. Tests override files take highest precedence.

**`scripts/engine/validate.test.ts`** — Tests safety bound detection in isolation using inline fixture parameter maps. Asserts that out-of-bounds temperature and speed values are correctly identified. This is the highest-priority unit test in the project.

**`scripts/serializers/prusaslicer.test.ts`** and **`bambu-orca.test.ts`** — Snapshot tests. A known resolved parameter map produces a known output. A failing snapshot means the format output changed — manual review required, not automatic acceptance.

**`src/lib/slug.ts`** — Colocated `slug.test.ts`. Roundtrip stability test. The slug format is a permanent contract.

### Integration tests (Vitest, in `tests/integration/`)

Tests each API route handler against real HTTP requests with a test feedback store. Asserts correct response shapes and error handling. Uses the fixture manifest.

### End-to-end tests (Playwright, in `tests/e2e/`)

**`generate-profile.spec.ts`** — Land → configure (fill 4 inputs) → generate → assert result page content → download → assert import guide appears. Feedback prompt is visible on page load (not gated by download).

**`feedback.spec.ts`** — All three feedback paths: Yes (thank-you), No (failure reason form → thank-you), Haven't printed yet (not-yet message).

**`url-prefill.spec.ts`** — Navigate to pre-filled URL → assert all fields filled → generate button immediately enabled.

**`unavailable-combination.spec.ts`** — Select a printer → select an unavailable material → assert non-interactive → assert generate button disabled.

### Naming conventions

- Unit test files: `[source-file].test.ts`, colocated
- Integration test files: `[route].test.ts`, in `tests/integration/`
- E2E spec files: `[user-journey].spec.ts`, in `tests/e2e/`
- Pattern: `describe("[module]") → it("[does what] when [given context]")`

---

## Shared Types

One file: `src/types.ts`.

Contains all TypeScript types, interfaces, and supported value constants for the MVP. Domain entities, API shapes, and the manifest schema are in one place.

The split into `domain.ts` / `api.ts` / `manifest.ts` from v1.0 is premature at this scale. It will be the right call in Phase 1 when the file grows significantly or multiple developers are working on distinct concerns. The split at that point is a five-minute refactor: move declarations, update imports.

`src/types.ts` imports from nothing in this project. It is the dependency root.

`scripts/engine/types.ts` contains engine-internal types only (layer schemas, resolved parameter maps). It does not import from `src/types.ts`. The engine imports nothing from `src/`.

---

## Documentation Structure

```
docs/
├── discovery/
│   ├── vision.md
│   ├── personas.md
│   ├── mvp.md
│   ├── mvp-spec.md
│   ├── roadmap.md
│   └── success-metrics.md
│
├── architecture/
│   ├── system-overview.md
│   ├── engine-approaches.md
│   ├── profile-persistence.md
│   └── folder-structure.md      ← this document
│
├── decisions/
│   └── discovery-review.md
│
└── delivery/
    └── README.md
```

### What belongs in each section

**`docs/discovery/`** — The problem space, personas, and MVP scope. Complete artifacts from the discovery phase. Treated as immutable historical record. If a delivery decision contradicts a discovery document, a new ADR is added to `docs/decisions/` — the discovery document is not edited.

**`docs/architecture/`** — Technical architecture decisions. Also largely complete. Changes during delivery that contradict an architecture document require a new ADR.

**`docs/decisions/`** — Architecture Decision Records. One document per significant decision: problem, alternatives, chosen approach, trade-offs accepted. Append-only. Superseded decisions get a `[Superseded by: ...]` header added — they are not deleted.

**`docs/delivery/`** — Operational guides written during the build phase:
- `combination-validation-runbook.md`
- `local-dev-setup.md`
- `deployment-runbook.md`
- `architecture-overview.md`

Not backfilled with past decisions. Written for operational knowledge: how to do X on this specific project.
