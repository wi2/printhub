# System Architecture Overview — Slicer Profile Generator

**Version:** 1.0  
**Status:** Draft — architecture phase  
**Scope:** MVP (Phase 0) with forward compatibility to Phase 1–2  
**Author perspective:** Staff Frontend Architect  
**Input documents:** `docs/discovery/`, `docs/decisions/discovery-review.md`

---

## 1. Architectural Context

Before any structural decision, two product-level facts shape every choice in this document:

1. **The 60 combinations are pre-validated, not generated on demand.** Every profile that can be served at MVP has already been physically test-printed and approved. "Generation" at runtime is a lookup, not computation. The rule-based engine runs at build time, not request time.

2. **The result URL is a product feature.** Stable, bookmarkable, shareable profile URLs are explicitly in scope. SEO value from static combination pages (`/profile/bambu-a1-mini-pla-04mm-balanced`) is the highest-ROI distribution channel identified in the discovery review. These two facts converge on the same architectural pattern: static generation.

These are not implementation preferences — they are constraints from the product spec that drive the entire rendering and data architecture.

---

## 2. Domain Model

### 2.1 Core Entities

```
Printer
  id            (slug, e.g. "bambu-a1-mini")
  name          (display, e.g. "Bambu Lab A1 Mini")
  manufacturer
  defaultSlicerFormat → SlicerFormat

Material
  id            (slug, e.g. "pla")
  name          (display, e.g. "PLA")

NozzleSize
  value         (numeric, e.g. 0.4)
  label         (display, e.g. "0.4mm")

PrintGoal
  id            (slug, e.g. "balanced")
  name          (display, e.g. "Balanced")
  description   (plain-English, shown on the card selector)

SlicerFormat
  id            (slug, e.g. "prusaslicer")
  name          (display, e.g. "PrusaSlicer")
  fileExtension (e.g. ".ini")

Combination
  printer       → Printer
  material      → Material
  nozzleSize    → NozzleSize
  goal          → PrintGoal
  isAvailable   (boolean — false until physically test-printed)
  slug          (canonical, e.g. "bambu-a1-mini-pla-04mm-balanced")

Profile
  combination   → Combination (1:1)
  slug          (same as Combination.slug — the canonical URL key)
  highlights[]  (three plain-English sentences)
  confidenceCount (integer — successful print reports)
  slicerFormat  → SlicerFormat (format this profile file is built for)
  profileFile   → ProfileFile

ProfileFile
  profile       → Profile
  slicerFormat  → SlicerFormat
  downloadPath  (CDN URL or static asset path)
  filename      (predictable: "[slug].[ext]")

FeedbackSession
  combination   → Combination
  outcome       (success | failure | pending)
  failureReasons[] (enum values when outcome = failure)
  submittedAt

ImportGuide
  slicerFormat  → SlicerFormat
  steps[]       (ordered, slicer-specific instructions)
  tip           (one inline tip per slicer/printer context)
```

### 2.2 Relationships

```
Printer           1 ──── * Combination
Material          1 ──── * Combination
NozzleSize        1 ──── * Combination
PrintGoal         1 ──── * Combination
Combination       1 ──── 0..1 Profile     (absent = not yet validated)
Profile           1 ──── 1..2 ProfileFile  (one per supported SlicerFormat)
Combination       1 ──── * FeedbackSession
SlicerFormat      1 ──── 1 ImportGuide
```

The `Combination` is the central entity. Every user action either builds toward a `Combination` (Configure stage) or acts on one (Result, Download, Feedback).

### 2.3 The Combination Manifest

The set of available `Combinations` — which printer × material × nozzle × goal tuples are validated and ready — is a build-time artifact. It is serialized as a static JSON manifest consumed by the frontend. The manifest is the source of truth for form availability logic (greyed-out states, generate button enablement).

The manifest does not change at runtime. Adding a new validated combination requires a new deployment.

---

## 3. User Flows

### 3.1 Primary Flow — Direct Generation

```
User visits /
  └─ Sees headline + single CTA
  └─ Clicks "Generate my profile"

User arrives at /configure
  └─ Form loads combination manifest (static, one-time fetch)
  └─ Selects: Printer → Material (greyed if not available) → Nozzle → Goal
  └─ SlicerFormat auto-populated from Printer; user may override
  └─ Generate button enables when all 4 inputs are filled
  └─ User clicks "Generate profile"

System resolves inputs → Combination slug
  └─ Redirects to /profile/[slug]
     (OR navigates client-side to the result screen — see §5.1)

User arrives at /profile/[slug]
  └─ Sees: Profile title · three highlights · confidence count
  └─ Clicks "Download profile"
     └─ File download begins
     └─ Import guide slides into view (same page, no navigation)
     └─ Feedback prompt appears below import guide

User submits feedback
  └─ Yes → thank-you confirmation
  └─ No → failure reason selector → thank-you confirmation
  └─ Not yet → opt-in email reminder (optional)
```

### 3.2 Direct URL Access (Pre-filled or Shared)

```
User arrives at /configure?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced
  └─ Form pre-fills all 4 inputs from query parameters
  └─ Generate button is immediately enabled
  └─ User reviews inputs, clicks "Generate profile"
  └─ Redirects to /profile/bambu-a1-mini-pla-04mm-balanced

User arrives at /profile/bambu-a1-mini-pla-04mm-balanced (direct/bookmark/share)
  └─ Sees full result screen
  └─ Can download the profile
  └─ Import guide and feedback are available
```

### 3.3 Unavailable Combination

```
User selects Printer → selects Material that is not yet validated for that Printer
  └─ Material option is greyed and non-selectable
  └─ No error state — option is simply disabled

User selects a Printer + Material + Nozzle combination with no validated profile
  └─ Inline message: "We haven't validated a [nozzle] profile for this combination yet."
  └─ Generate button remains disabled

User accesses /profile/[slug] for a combination that has been deprecated
  └─ Profile page renders a "no longer available" state
  └─ Link back to /configure
```

### 3.4 Return Visit

```
User returns to /profile/[slug] after printing
  └─ Same page renders (result is stable)
  └─ Download button is still active
  └─ Feedback prompt is shown again (not pre-filled from prior visit)
  └─ Confidence count reflects any new successful reports since last visit
```

---

## 4. Frontend Architecture

### 4.1 Rendering Strategy

| Route | Rendering | Rationale |
|---|---|---|
| `/` (Home) | SSG | Static, no dynamic data, SEO entry point |
| `/configure` | CSR with SSR shell | Form is interactive; availability state is client-driven from manifest |
| `/profile/[slug]` | SSG + ISR | Pre-rendered per combination at build time; confidence count revalidated on interval |

The result pages at `/profile/[slug]` are the core of the SEO strategy. Each of the 60 slugs maps to a pre-rendered page. When a new combination is validated and added to the manifest, it is included in the next build. When a profile is revised, the relevant page is revalidated.

The confidence count on the result page is the only dynamic data on an otherwise static page. It is fetched client-side on mount and optionally refreshed after a feedback submission. It does not block the render.

### 4.2 Page and Feature Structure

```
Pages
├── Home          /
├── Configure     /configure
└── Result        /profile/[slug]

Feature modules (collocated with their pages)
├── configure/
│   ├── CombinationForm       — orchestrates the 4 inputs
│   ├── PrinterSelector       — searchable dropdown
│   ├── MaterialSelector      — segmented selector with greyed states
│   ├── NozzleSelector        — segmented selector
│   ├── GoalSelector          — two-card selector with descriptions
│   ├── SlicerOverride        — small dropdown, secondary
│   └── FormAvailability      — reads manifest, computes valid states
│
└── result/
    ├── ProfileCard           — title + three highlights + confidence count
    ├── DownloadButton        — triggers file download, drives post-download reveal
    ├── ImportGuide           — slicer-specific steps, hidden until download
    └── FeedbackPrompt        — Yes / No / Not yet, with failure reason sub-form

Shared
├── ui/                       — design system primitives (no product logic)
└── data/                     — manifest loader, API client, types
```

### 4.3 Component Responsibilities

**`CombinationForm`** is the only component that needs to understand the full combination state. It owns the four selected values, derives the slicer format, derives the resolved slug, and controls the generate button state. It does not own navigation — it delegates to a route change on submission.

**`FormAvailability`** reads the combination manifest and exposes a single function: `isAvailable(printer, material, nozzle, goal) → boolean`. It has no UI. It is a pure data concern consumed by the individual selectors.

**`ProfileCard`** renders from props only. It does not fetch. The confidence count is passed in from the page, which fetches it separately on mount. The card renders immediately with the static data and updates the count when the fetch resolves.

**`DownloadButton`** tracks its own local `hasDownloaded` state. On first click it triggers the file download and flips the state, which causes `ImportGuide` and `FeedbackPrompt` to appear. Subsequent clicks re-trigger the download without hiding the guide.

**`FeedbackPrompt`** tracks its own local `hasSubmitted` state. It submits once per page session. It does not know about prior submissions from other sessions — the prompt is always shown on arrival.

---

## 5. State Management Strategy

### 5.1 URL as Primary State

The most important state management decision in this product: **the URL is the single source of truth for the current combination.**

- `/profile/bambu-a1-mini-pla-04mm-balanced` encodes the full combination in the slug
- `/configure?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced` encodes form pre-fill state
- Neither requires a store, session, or cookie to reconstruct

This means:
- Users can bookmark results
- Shared links land on the exact same state
- Browser back/forward behaves correctly without special handling
- SSG pre-rendering works naturally because the page content is determined entirely by the URL

### 5.2 State Map

| State | Owner | Persistence | Notes |
|---|---|---|---|
| Form inputs (4 values) | Local React state | None — ephemeral | Initialized from URL query params if present |
| Combination manifest | Module-level cache | Session — one fetch per load | Changes only on new deployment |
| Profile static data (highlights, slug, file path) | Server — embedded in SSG page | Build-time | Never re-fetched |
| Confidence count | Server state (React Query or equivalent) | None — refetched on mount | Does not block render |
| Download triggered | Local component state (`DownloadButton`) | None | Drives import guide visibility |
| Feedback outcome | Local component state (`FeedbackPrompt`) | None | Submitted once per session, then replaced with confirmation |
| Slicer format selection | Derived from Printer selection | None | Override stored in form local state |

### 5.3 What There Is No State For

At MVP:
- No user identity state
- No saved profiles state
- No cross-session persistence
- No global application store

The absence of a global store is a deliberate constraint, not an oversight. The product does not need it at MVP, and introducing one would create complexity that has no corresponding value until accounts are added in Phase 1.

### 5.4 URL Pre-fill Contract

The Configure page must accept all four form inputs as URL query parameters:

```
?printer=[printer-slug]
&material=[material-slug]
&nozzle=[0.4|0.6]
&goal=[balanced|quality]
```

When these are present, the form initializes with those values. Invalid values are silently ignored and the field is left empty. This contract is stable and must not change after launch — external links (from filament brand QR codes, community posts, filament brand partnerships) will rely on it.

---

## 6. API Boundaries

### 6.1 Boundary Principles

At MVP, the surface area is intentionally minimal. Most content is static. The only truly dynamic operations are feedback submission and the confidence count read. Everything else is either a static asset, a build-time artifact, or a URL redirect.

### 6.2 Endpoints

| Endpoint | Method | Consumer | Notes |
|---|---|---|---|
| `/combinations.json` | GET (static) | Configure form | Served as a build artifact from CDN. Contains all validated combinations and their availability status. |
| `/api/generate` | POST | Configure form | Receives `{printer, material, nozzle, goal, slicerFormat}`. Returns `{slug, profileUrl}`. Validates inputs against the combination manifest. Does not build a profile — resolves the slug and returns the canonical URL. |
| `/api/profile/[slug]/stats` | GET | Result page (on mount) | Returns `{confidenceCount}`. Lightweight. Does not return profile content (that is static). |
| `/api/feedback` | POST | Feedback prompt | Receives `{slug, outcome, failureReasons[]}`. Returns `{ok}`. No authentication. Stores anonymously. |
| `/api/profile/[slug]/download` | GET | Download button | Serves the profile file. Sets correct `Content-Disposition` header with predictable filename. Records a download event. |

### 6.3 What Is Not an API Call

- **Profile content** (highlights, title, slicer format, import guide steps) — embedded in the SSG-rendered page at build time
- **Combination availability** — encoded in the static manifest, consumed by the frontend
- **Import guide content** — static, keyed by slicer format, embedded in the result page template
- **Safety guardrails** — enforced at build time when profiles are assembled, not at request time

### 6.4 `POST /api/generate` — Intent

This endpoint exists for one reason: to provide a stable, validated entry point from the form submission. Its job is:

1. Validate the combination exists and is available
2. Return the canonical slug (and thus the canonical URL)
3. Record a generation event in analytics

It does not generate a profile. It does not call any external service. It is a fast lookup against the combination manifest. This is why the < 3 second response time target is achievable without infrastructure scaling concerns.

### 6.5 Slicer Format Abstraction Boundary

The internal parameter representation is slicer-agnostic. A parameter like `layerHeight: 0.2` exists in the domain model once. A serialization layer — one per supported slicer format — translates it to the correct key name, data type, and file structure for that slicer.

```
Internal Parameters
        │
        ├── PrusaSlicerSerializer  → .ini config bundle
        └── BambuOrcaSerializer   → .3mf project template
```

This boundary is the primary mitigation for the slicer format instability risk. When Bambu Studio changes its JSON schema, only `BambuOrcaSerializer` changes. The domain model and the rule engine are unaffected. The profile files are rebuilt, validated, and re-deployed.

This boundary must be maintained strictly. No slicer-specific keys or logic should appear outside the serialization layer.

---

## 7. Architectural Risks

### R1. Slicer Format Schema Drift (Severity: High)

Bambu Studio and Orca Slicer are in active development. Their profile schemas have changed multiple times. PrusaSlicer 2.x and 3.x differ in non-trivial ways. Each schema change requires: detection → serializer update → profile rebuild → full 60-combination re-validation → deployment.

**Architectural response:** The serialization boundary in §6.5 is the primary containment. Additionally, automated import validation must run in CI on every deployment — not just on profile builds. A schema change in a slicer update will surface as a CI failure before it reaches users.

**Residual risk:** We do not control slicer release schedules. A slicer update can break production profiles before CI catches it if users update their slicers before we detect the schema change.

---

### R2. Static Manifest Latency on New Combinations (Severity: Medium)

Adding a new validated combination requires: profile build → manifest update → deployment → ISR revalidation of affected pages. In the fastest case this is minutes; in a cautious deployment process it is hours.

**Architectural response:** Accept this constraint at MVP. The manifest is not a live database — it reflects validated, test-printed combinations, which do not change frequently. Treating the manifest as a deploy artifact is correct for the quality bar we are holding.

**What this means for the team:** The manifest update and deployment must be part of the combination-validation workflow, not an afterthought.

---

### R3. Profile URL Slug Stability (Severity: High)

Profile slugs are permanent identifiers. They appear in bookmarks, community posts, filament brand QR codes, and SEO indexes. If a slug changes — for any reason — every external reference breaks, every bookmark 404s, and SEO rankings reset.

**Architectural response:** Slug generation must be deterministic and treated as a stable contract from day one. The slug format (`[printer-id]-[material-id]-[nozzle]-[goal]`) must be versioned. If a printer's canonical ID changes (e.g., a rename), the old slug must redirect permanently (HTTP 301) to the new one. Redirects are maintained indefinitely.

This is not an edge case — it is a forward compatibility guarantee that must be built in from the first deploy.

---

### R4. Confidence Count Consistency (Severity: Low)

The confidence count is fetched client-side on mount and updates optimistically when a "Yes" feedback is submitted. There is a window where:
- Two users on the same profile page submit "Yes" nearly simultaneously
- Both see an optimistic increment
- The server count is only incremented once (race condition)

**Architectural response:** The confidence count is a soft count, not a financial transaction. Eventual consistency is acceptable. The count should be refetched from the server after any feedback submission rather than relying purely on client-side optimistic updates.

---

### R5. Feedback Survivorship Bias (Severity: Medium — data quality, not product)

Users who had a successful print are more likely to return to the result page and submit feedback. The reported first-print success rate will structurally overstate the true rate. This is documented in the discovery review.

**Architectural response:** The feedback data model must capture submission timestamp and whether the user returned to the page (vs. submitted on first visit). This gives a weak proxy for distinguishing voluntary return feedback from same-session feedback. An opt-in 48-hour email reminder (already in spec) is the best mechanism for reaching non-returning users.

The metrics layer must surface the raw response count alongside the success rate so that a 95% success rate from 3 responses is not treated the same as a 95% rate from 300 responses.

---

### R6. Safety Guardrails as a Build-Time Concern (Severity: Critical)

Temperature values above material spec and speed values above printer spec are zero-tolerance failure conditions (per `mvp-spec.md`). These guardrails must be enforced at the point where profile parameter values are set — at build time when profiles are assembled — not at request time.

**Architectural response:** Safety guardrail checks are part of the build pipeline, run before a profile is added to the manifest. A profile that fails a guardrail check is rejected and never enters the combination manifest. This is not a runtime validation — it is a build gate.

The guardrail rules (material temperature bounds, printer speed bounds) are a separate, independently maintained configuration. They are not embedded in profile data. Any change to a guardrail rule triggers a full rebuild of all profiles.

---

### R7. Form State Lost on Navigate-Away (Severity: Low)

If a user partially fills the Configure form and navigates away, their selections are lost. There is no persistence at MVP (no accounts, no local storage save).

**Architectural response:** Accept this at MVP. The form is four inputs with large targets — re-filling it takes under 30 seconds. The URL pre-fill mechanism provides a path for users who share or bookmark a partially-configured URL. A local storage save of form state is a candidate for Phase 1, not MVP.

---

## 8. Forward Compatibility Notes

These decisions are made at MVP with Phase 1–2 in mind. They are not built now, but the architecture must not close them off.

| Future capability | Architectural pre-condition |
|---|---|
| User accounts + saved profiles | URL slug as profile identity (already in place) — saved profiles are just persisted slug references |
| Confidence count improvements (Phase 1) | Separate `stats` endpoint (§6.2) means the count mechanism can evolve without touching the static page |
| Additional slicer formats | Serialization boundary (§6.5) means new formats add a new serializer class, not a change to the domain model |
| Fine-tuning overlay (Phase 2) | The Profile entity's parameter representation needs to be exposed; currently it is only consumed at build time |
| API access for integrations (Phase 3) | `POST /api/generate` and `GET /api/profile/[slug]` are already structured as API endpoints; adding authentication and rate limiting is additive |
| ML-based parameter engine (Phase 4) | The rule engine produces the same output shape as any future engine would — the frontend and API boundaries are engine-agnostic |
