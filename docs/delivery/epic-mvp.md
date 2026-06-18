# Epic: MVP — Generate a Validated Slicer Profile

**Status:** Ready for delivery
**Input documents:** `docs/discovery/mvp-spec.md`, `docs/architecture/system-overview.md`, `docs/architecture/folder-structure.md`

---

## Epic Statement

A user tells us their printer, material, nozzle size, and print goal. We give them a ready-to-import slicer profile and show them exactly how to use it. No account. No wait. No guessing.

---

## Scope Challenges

Four decisions from the approved spec were challenged before this epic was written. Each reduces real build cost against a marginal reduction in launch value.

### Cut 1 — Remove the SlicerOverride UI

The spec includes a secondary dropdown that lets users override the auto-selected slicer format. At launch there are two slicers and five printers. Every printer maps to exactly one default slicer. There are no users yet to validate that anyone needs to override it. The override adds a fifth interactive element to a four-input form without a demonstrated use case.

**Decision:** The form has four inputs. The slicer format is determined by printer selection and is not user-overridable in the UI at MVP. The download serves the printer's default format. This is not deferred — it is removed. If feedback shows users want cross-format downloads, it is added in Phase 1.

### Cut 2 — Defer the Stats API and confidence count until post-launch

The confidence count on the result page reads "Validated on N successful prints." At launch there are zero feedback submissions. N is zero. Fetching a live count that returns zero on every request adds a runtime endpoint, a TanStack Query hook, refetch-after-feedback logic, and infrastructure for a number that means nothing to the first 500 users.

**Decision:** At launch, all profiles show the static message "New profile — be the first to report results." The stats endpoint (`GET /api/profile/:slug/stats`) and `useProfileStats` hook are built in the first post-launch week, once there is data worth showing.

### Cut 3 — Remove the email reminder from the "Haven't printed yet" path

The spec includes an opt-in email reminder 48 hours after download for users who say they haven't printed yet. This requires: email infrastructure, unsubscribe handling, a reminder queue, a return-visit detection mechanism, and privacy/consent copy. None of this ships in a day. The failure mode if it is cut is: users who haven't printed yet see a message and no follow-up email. The failure mode if it is built wrong is: unsolicited email, GDPR exposure, broken unsubscribe.

**Decision:** The "Haven't printed yet" button shows a message: "No problem — come back after your print and let us know how it went." No email collection. No reminder queue. Email reminders are Phase 1 after the feedback loop is validated.

### Cut 4 — Launch with 20 tested combinations, not 60

The spec requires all 60 combinations to pass a physical test print before appearing in the form. 60 test prints at 1–2 hours each is 60–120 hours of printing time on the critical path. That delays launch by weeks for combinations that represent a small fraction of likely user demand.

**Decision:** Launch with 20 validated combinations — PLA and PETG on all 5 printers, both nozzle sizes, Balanced goal only. This covers the highest-demand use cases. TPU combinations, Quality goal profiles, and the second print goal are added weekly post-launch as physical tests complete. Untested combinations simply do not appear in the form.

The 20-combination launch set:

| Printer | Material | Nozzle | Goal |
|---|---|---|---|
| Bambu A1 Mini | PLA | 0.4mm | Balanced |
| Bambu A1 Mini | PLA | 0.6mm | Balanced |
| Bambu A1 Mini | PETG | 0.4mm | Balanced |
| Bambu A1 Mini | PETG | 0.6mm | Balanced |
| Bambu X1C | PLA | 0.4mm | Balanced |
| Bambu X1C | PLA | 0.6mm | Balanced |
| Bambu X1C | PETG | 0.4mm | Balanced |
| Bambu X1C | PETG | 0.6mm | Balanced |
| Prusa MK4 | PLA | 0.4mm | Balanced |
| Prusa MK4 | PLA | 0.6mm | Balanced |
| Prusa MK4 | PETG | 0.4mm | Balanced |
| Prusa MK4 | PETG | 0.6mm | Balanced |
| Creality Ender 3 V3 SE | PLA | 0.4mm | Balanced |
| Creality Ender 3 V3 SE | PLA | 0.6mm | Balanced |
| Creality Ender 3 V3 SE | PETG | 0.4mm | Balanced |
| Creality Ender 3 V3 SE | PETG | 0.6mm | Balanced |
| Creality K1 | PLA | 0.4mm | Balanced |
| Creality K1 | PLA | 0.6mm | Balanced |
| Creality K1 | PETG | 0.4mm | Balanced |
| Creality K1 | PETG | 0.6mm | Balanced |

---

## Milestones

```
M1: Foundation          M2: Profile Engine          M3: Frontend
━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━
Scaffold + types   →    Layers + resolver       →    3 screens
Walking skeleton        Serializers + build          end-to-end
                        Manifest generated

                        M4: Runtime API              M5: Launch Gate
                        ━━━━━━━━━━━━━━━━             ━━━━━━━━━━━━━━
              (parallel) Feedback endpoint            Physical tests
                         Stats deferred               CI pipeline
                                                      Checklist sign-off
```

M4 (API) runs in parallel with M3 (Frontend). M5 can only begin after M2 (profiles exist to test) and requires M3 and M4 to be complete before final sign-off.

---

## Milestone 1 — Foundation

**Goal:** The project runs locally. Routing works. One hardcoded profile page renders in the browser. Every subsequent milestone starts from a working skeleton, not a blank file.

The walking skeleton story (S-1.3) is the most important story in the milestone. It forces every foundational decision — routing, rendering, types, page structure — to be made against a real screen, not in the abstract.

---

### S-1.1 — Scaffold the project

> As a developer, I want a running Vite + React + TypeScript project with test tooling configured, so that every subsequent story has a working foundation to build on.

**Acceptance criteria**
- [ ] `npm run dev` starts the dev server without errors
- [ ] `npm run build` produces a `dist/` folder without errors
- [ ] `npm run test` runs Vitest and reports a passing sanity test (`1 + 1 === 2`)
- [ ] `npm run test:e2e` runs Playwright against the dev server without errors
- [ ] `tsconfig.json` covers `src/`; `tsconfig.node.json` covers `scripts/` and `server/`
- [ ] `generated/` is listed in `.gitignore`
- [ ] Folder structure from `docs/architecture/folder-structure.md` is in place (empty directories with `.gitkeep` where needed)

**Out of scope**
- Any real application code
- UI components
- Linting or formatting configuration (add later if needed)

---

### S-1.2 — Define all domain types

> As a developer, I want all domain types and supported value constants defined in `src/types.ts`, so that every other file in the project has a single, authoritative source of truth for the data model.

**Acceptance criteria**
- [ ] `src/types.ts` defines types for: `Printer`, `Material`, `NozzleSize`, `PrintGoal`, `SlicerFormat`, `Combination`, `Profile`, `FeedbackSession`, `ImportGuide`
- [ ] `src/types.ts` exports typed constants: `PRINTERS` (5 entries), `MATERIALS` (3 entries), `NOZZLE_SIZES` (2 entries), `GOALS` (2 entries), `SLICER_FORMATS` (2 entries)
- [ ] `src/types.ts` exports the `Manifest` type describing the shape of `generated/combinations.json`
- [ ] `src/types.ts` imports from nothing in the project
- [ ] TypeScript compiles with zero errors

**Out of scope**
- Engine-internal types (live in `scripts/engine/types.ts`, written in M2)
- API request/response shapes (added when the API is built in M4)

---

### S-1.3 — Render a hardcoded profile page (walking skeleton)

> As a developer, I want to navigate to `/profile/bambu-a1-mini-pla-04mm-balanced` in the browser and see a rendered result page with hardcoded content, so that routing, page structure, and component hierarchy are proven before any real data exists.

**Acceptance criteria**
- [ ] React Router (or equivalent) is configured; navigating to `/` renders a placeholder Home page
- [ ] Navigating to `/profile/bambu-a1-mini-pla-04mm-balanced` renders a Profile page with:
  - Profile title: "Bambu A1 Mini · PLA · 0.4mm · Balanced"
  - Three hardcoded highlight sentences
  - A non-functional "Download profile" button
  - A confidence count placeholder ("New profile — be the first to report results")
- [ ] Navigating to `/configure` renders a placeholder Configure page
- [ ] `PageLayout.tsx` wraps all three pages with consistent padding and max-width
- [ ] No network requests are made — all content is hardcoded

**Out of scope**
- Real manifest data
- Functional buttons
- Any form inputs

---

## Milestone 2 — Profile Engine

**Goal:** All layer files are authored and correct. The build script resolves all combinations, passes them through guardrails, serializes them to the correct formats, and produces `generated/combinations.json` and the 40 profile files (20 combinations × 2 formats).

This milestone has two parallel tracks: **data authoring** (layer YAML files, written by someone with 3D printing domain expertise) and **engine code** (TypeScript). These can proceed simultaneously.

---

### S-2.1 — Define engine-internal types

> As a developer, I want engine-internal types defined in `scripts/engine/types.ts`, so that the resolver, validator, and serializers share a common contract for layer schemas and resolved parameter maps.

**Acceptance criteria**
- [ ] `scripts/engine/types.ts` defines `LayerSchema` — the shape of a valid parameter YAML layer file
- [ ] `scripts/engine/types.ts` defines `ResolvedParams` — the slicer-agnostic parameter map produced by the resolver
- [ ] `scripts/engine/types.ts` defines `GuardrailBounds` — the shape of `layers/guardrails.yaml`
- [ ] `scripts/engine/types.ts` defines `ValidationResult` — `{ valid: true }` or `{ valid: false, violations: Violation[] }`
- [ ] No imports from `src/`
- [ ] TypeScript compiles with zero errors under `tsconfig.node.json`

---

### S-2.2 — Implement the layer resolver

> As a developer, I want a resolver that merges layer files in the correct order and returns a fully resolved parameter map, so that the build script can produce a complete parameter set for any combination.

**Acceptance criteria**
- [ ] `scripts/engine/resolve.ts` exports `resolve(combination): ResolvedParams`
- [ ] Layers are merged in order: global defaults → printer → material → goal → nozzle → override (if present)
- [ ] The most specific layer wins: if two layers set the same parameter key, the value from the more specific layer is used
- [ ] If no override file exists for a combination, the merge proceeds without error
- [ ] `resolve` does not read files itself — it accepts pre-loaded layer objects, making it testable without I/O

**Acceptance criteria — tests (`resolve.test.ts`)**
- [ ] Goal layer value overrides material layer value for the same key
- [ ] Field not set by any specific layer resolves to the global default
- [ ] Override layer value overrides all other layers for the same key
- [ ] A combination with no override file resolves without error
- [ ] All four tests pass: `npm run test`

---

### S-2.3 — Implement the guardrail validator

> As a developer, I want a validator that checks a resolved parameter map against safety bounds, so that no profile with unsafe temperature or speed values can be committed to the manifest.

**Acceptance criteria**
- [ ] `scripts/engine/validate.ts` exports `validate(params: ResolvedParams, bounds: GuardrailBounds): ValidationResult`
- [ ] Returns `{ valid: true }` when all parameters are within bounds
- [ ] Returns `{ valid: false, violations: [...] }` listing every out-of-bounds parameter when any value exceeds its bound
- [ ] Does not modify the parameter map
- [ ] Does not perform I/O — accepts pre-loaded bounds object

**Acceptance criteria — tests (`validate.test.ts`)**
- [ ] A parameter map within all bounds returns `valid: true`
- [ ] A nozzle temperature above the material maximum returns `valid: false` with the correct violation
- [ ] A print speed above the printer maximum returns `valid: false` with the correct violation
- [ ] Multiple violations in a single map are all reported in one call
- [ ] All four tests pass: `npm run test`

---

### S-2.4 — Author the global defaults and guardrails layer files

> As a domain expert, I want `layers/global-defaults.yaml` and `layers/guardrails.yaml` authored with correct parameter values, so that the resolver has a safe fallback for every parameter and the validator has defined safety bounds.

**Note:** This story requires 3D printing domain expertise. It is data authoring, not code. A developer can review YAML syntax; a domain expert must own the parameter values.

**Acceptance criteria**
- [ ] `layers/global-defaults.yaml` provides a value for every parameter key defined in `LayerSchema` — no required key is absent
- [ ] `layers/guardrails.yaml` defines minimum and maximum bounds for: nozzle temperature, bed temperature, print speed, and first-layer speed — per material and per printer where values differ
- [ ] A second domain expert has reviewed all values for correctness before this story is considered done
- [ ] The build script can load both files without YAML parse errors

---

### S-2.5 — Author all printer layer files

> As a domain expert, I want layer files for all five supported printers authored with correct printer-specific parameter values, so that the resolver can produce accurate combination outputs.

**Acceptance criteria**
- [ ] `layers/printers/bambu-a1-mini.yaml` is authored and reviewed
- [ ] `layers/printers/bambu-x1c.yaml` is authored and reviewed
- [ ] `layers/printers/prusa-mk4.yaml` is authored and reviewed
- [ ] `layers/printers/creality-ender-3-v3-se.yaml` is authored and reviewed
- [ ] `layers/printers/creality-k1.yaml` is authored and reviewed
- [ ] Each file sets printer-specific parameters: bed dimensions, max print speed, firmware flavor, motion system characteristics
- [ ] Each file's slug matches the filename (without `.yaml`) exactly — validated by the build script
- [ ] A second domain expert has reviewed all five files

---

### S-2.6 — Author material, goal, and nozzle layer files

> As a domain expert, I want layer files for all three materials, two goals, and two nozzle sizes authored with correct values, so that the full combination space can be resolved.

**Acceptance criteria**
- [ ] `layers/materials/pla.yaml`, `petg.yaml`, `tpu.yaml` are authored and reviewed
- [ ] Each material file sets: nozzle temperature range, bed temperature, cooling fan speed, retraction
- [ ] `layers/goals/balanced.yaml` and `quality.yaml` are authored and reviewed
- [ ] Each goal file sets: layer height, print speed multiplier, infill density, infill pattern
- [ ] `layers/nozzles/0.4mm.yaml` and `0.6mm.yaml` are authored and reviewed
- [ ] Each nozzle file sets: line width, max/min layer height, volumetric flow constraints
- [ ] `layers/overrides/` directory exists and is empty (no overrides needed at MVP launch)
- [ ] A second domain expert has reviewed all files

---

### S-2.7 — Implement the PrusaSlicer serializer

> As a developer, I want a serializer that translates a resolved parameter map into a valid PrusaSlicer `.ini` config bundle, so that Prusa MK4, Creality Ender 3 V3 SE, and Creality K1 profiles can be generated.

**Acceptance criteria**
- [ ] `scripts/serializers/prusaslicer.ts` exports `serialize(params: ResolvedParams, combination: Combination): string`
- [ ] Output is a valid `.ini` config bundle with `[print]`, `[filament]`, and `[printer]` sections
- [ ] All required PrusaSlicer parameters are present — no required field is empty
- [ ] No Bambu/Orca-specific keys appear in the output
- [ ] A snapshot test in `prusaslicer.test.ts` captures the output for a fixture input — snapshot must be manually reviewed and approved before being committed
- [ ] Importing the output file into PrusaSlicer 2.x does not produce an import error

---

### S-2.8 — Implement the Bambu/Orca serializer

> As a developer, I want a serializer that translates a resolved parameter map into a valid Bambu Studio / Orca Slicer `.3mf` project template, so that Bambu A1 Mini, Bambu X1C, and Creality K1 profiles can be generated.

**Acceptance criteria**
- [ ] `scripts/serializers/bambu-orca.ts` exports `serialize(params: ResolvedParams, combination: Combination): Buffer`
- [ ] Output is a valid `.3mf` archive containing process, filament, and printer profile JSON files
- [ ] All required Bambu/Orca parameters are present
- [ ] No PrusaSlicer-specific keys appear in the output
- [ ] A snapshot test in `bambu-orca.test.ts` captures the JSON structure — snapshot manually reviewed before commit
- [ ] Importing the output file into Bambu Studio or Orca Slicer does not produce an import error

---

### S-2.9 — Implement the build script and manifest generator

> As a developer, I want a single build command that resolves all combinations, validates them against guardrails, serializes them to profile files, and produces `generated/combinations.json`, so that the frontend has a manifest to consume and profile files are ready to serve.

**Acceptance criteria**
- [ ] `scripts/build.ts` can be run with `npx tsx scripts/build.ts` (or equivalent)
- [ ] For each combination: resolves parameters, validates against guardrails, calls both serializers, writes output to `generated/profiles/prusaslicer/[slug].ini` and `generated/profiles/bambu-orca/[slug].3mf`
- [ ] A combination that fails guardrail validation is logged with the violation details and excluded from the manifest — it does not cause the whole build to fail
- [ ] `generated/combinations.json` is produced and contains every validated combination with: slug, printer/material/nozzle/goal metadata, `isAvailable: true`, slicer format, download path, and three placeholder highlight strings
- [ ] Running the build twice produces identical output (deterministic)
- [ ] The build completes in under 60 seconds for 20 combinations

**Out of scope**
- Plain-English highlight generation (hardcoded placeholder strings are acceptable at this stage; highlights are authored manually per combination in S-3.5)

---

## Milestone 3 — Frontend

**Goal:** All three screens work end-to-end. A user can fill the form, navigate to the result page, see real data from the manifest, download a file, see the import guide, and submit feedback.

M3 can begin before M2 is complete. Stories S-3.1 and S-3.2 (Home page and Configure form inputs) can be built against the hardcoded skeleton from M1. Stories S-3.3 onward depend on `generated/combinations.json` from M2.

---

### S-3.1 — Implement the Home page

> As a visitor, I want to arrive at the product and immediately understand what it does, so that I know whether to continue.

**Acceptance criteria**
- [ ] `/` renders a headline, a 2–3 sentence description, and a single "Generate my profile" CTA button
- [ ] Clicking the CTA navigates to `/configure`
- [ ] No registration prompt, login wall, or pricing information appears on the page
- [ ] Page renders with no JavaScript errors in the browser console

---

### S-3.2 — Implement the Configure form inputs

> As a user, I want to see and interact with all four selection inputs on a single screen, so that I can describe my setup and generate a profile.

**Acceptance criteria**
- [ ] `/configure` renders four inputs: Printer (searchable dropdown), Material (segmented selector), Nozzle Size (segmented selector), Print Goal (two-card selector with descriptions)
- [ ] All four inputs are visible simultaneously on a single screen — no step-by-step wizard
- [ ] "Generate profile" button is greyed and non-interactive when any required input is missing
- [ ] "Generate profile" button becomes active when all four inputs are filled
- [ ] Selecting a printer auto-selects the correct slicer format (Bambu printers → Bambu/Orca; Prusa/Creality → PrusaSlicer) — this selection is not shown to users and is not overridable
- [ ] No network request is made by the form inputs

**Out of scope**
- Availability logic (greyed-out materials) — that is S-3.3
- Form submission — that is S-3.4

---

### S-3.3 — Implement availability logic

> As a user, I want to see which materials and nozzle sizes are available for my selected printer, so that I do not attempt to generate a profile for a combination that has not been validated.

**Acceptance criteria**
- [ ] `src/pages/configure/availability.ts` exports `isAvailable(printer, material, nozzle, goal): boolean` driven by the combination manifest
- [ ] The manifest is fetched once on the configure page load and cached for the session (module-level cache — no TanStack Query needed)
- [ ] A material option is non-interactive and visually greyed when no validated profile exists for the current printer + that material (regardless of nozzle or goal)
- [ ] When a user selects a printer + material + nozzle combination with no validated profile, a message appears: "We haven't validated a [nozzle]mm profile for this combination yet." The generate button remains disabled
- [ ] A material that becomes available when the printer changes updates immediately without page reload

---

### S-3.4 — Wire form submission to profile URL

> As a user, I want to click "Generate profile" and be taken to the result page for my combination, so that I can see and download my profile.

**Acceptance criteria**
- [ ] Clicking "Generate profile" with all four inputs filled navigates to `/profile/[slug]`
- [ ] The slug is constructed client-side from the four input values: `[printer]-[material]-[nozzle]-[goal]`
- [ ] During navigation, the button label changes to "Generating…" and inputs are locked (minimum 800ms simulated delay so the transition is not jarring)
- [ ] If the constructed slug does not exist in the manifest, the user is shown an error message on the configure page — they are not navigated to a broken result URL
- [ ] No server request is made during form submission

---

### S-3.5 — Author plain-English highlights for all 20 launch combinations

> As a domain expert, I want three plain-English highlight sentences authored for each of the 20 launch combinations, so that the result page explains the profile to users in accessible language.

**Note:** This is content authoring, not code. Highlights are embedded in `generated/combinations.json` as part of the build, replacing the placeholder strings from S-2.9.

**Acceptance criteria**
- [ ] Each of the 20 combinations in `generated/combinations.json` has exactly three highlight strings
- [ ] Each highlight is one sentence, written for a non-expert audience
- [ ] Each highlight explains a specific parameter decision and why it was made for this combination (e.g. "Print speed is set to 180mm/s — fast for efficiency, conservative enough for consistent quality.")
- [ ] No highlight repeats information covered by another highlight in the same set
- [ ] A second reviewer has read all highlights for clarity and accuracy before they are committed

---

### S-3.6 — Implement the Profile page

> As a user, I want to arrive at the result page and see my profile's title, three highlights, and a download button, so that I understand what I am downloading before I download it.

**Acceptance criteria**
- [ ] `/profile/[slug]` renders the profile title in the format "[Printer] · [Material] · [Nozzle] · [Goal]"
- [ ] Three plain-English highlight sentences are rendered from the manifest data
- [ ] The confidence count placeholder renders: "New profile — be the first to report results"
- [ ] A "Download profile" button is prominently displayed
- [ ] A "Share this profile" link copies the current URL to the clipboard and shows a brief "Copied!" confirmation
- [ ] Navigating directly to a valid slug renders the full page
- [ ] Navigating to an invalid slug (not in the manifest) renders a "This profile is no longer available" message with a link back to `/configure`

---

### S-3.7 — Implement the Download button and Import Guide

> As a user, I want to click "Download profile" and immediately see instructions for how to import the file into my slicer, so that the journey does not end at a file I do not know how to use.

**Acceptance criteria**
- [ ] Clicking "Download profile" triggers a file download with the correct filename: `[slug].[ext]`
- [ ] The correct file extension is used: `.ini` for PrusaSlicer, `.3mf` for Bambu/Orca
- [ ] After the first click, the Import Guide slides into view below the download button on the same page — no navigation
- [ ] Subsequent clicks re-trigger the download without hiding the Import Guide
- [ ] The Import Guide shows the correct slicer-specific steps, determined by the printer's default slicer format
- [ ] The Bambu Studio / Orca Slicer guide contains the steps from `docs/discovery/mvp-spec.md` §Stage 4
- [ ] The PrusaSlicer guide contains the steps from `docs/discovery/mvp-spec.md` §Stage 4
- [ ] Each guide includes the slicer-specific inline tip specified in the spec
- [ ] The Feedback prompt appears below the Import Guide after download (visible but not intrusive)

---

### S-3.8 — Implement the Feedback prompt

> As a user, I want to tell the product whether my print succeeded, so that my experience contributes to improving the profile for others.

**Acceptance criteria**
- [ ] Three buttons appear: "Yes — it worked", "No — it failed", "I haven't printed yet"
- [ ] Clicking "Yes": shows "Thanks. This helps us improve the profile for everyone." No further action required.
- [ ] Clicking "No": shows a follow-up with five preset failure reason options (multi-select). Selecting at least one and clicking "Submit" shows "Thanks for the report. We'll review this combination." (The API submission is wired in M4.)
- [ ] Clicking "I haven't printed yet": shows "No problem — come back after your print and let us know how it went." No email collection. No reminder.
- [ ] The prompt is shown once per page session. After any response, the buttons are replaced by the confirmation message.
- [ ] The prompt renders immediately on page load — it is not shown only after download. (Download triggers the Import Guide reveal; the prompt is already visible below it.)

**Out of scope**
- Submitting to the API (wired in M4-S4.3)
- Email reminder flow (cut from MVP)

---

### S-3.9 — Implement URL pre-fill for the Configure form

> As a user arriving from an external link, I want the Configure form to be pre-filled from URL query parameters, so that I can review my inputs and generate immediately without re-entering them.

**Acceptance criteria**
- [ ] Navigating to `/configure?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced` pre-fills all four inputs
- [ ] When all four inputs are pre-filled from valid URL params, the generate button is active immediately
- [ ] An invalid URL param value (e.g. `?printer=nonexistent`) is silently ignored — the field is left empty
- [ ] Valid params are pre-filled; invalid params are ignored — a URL with 3 valid and 1 invalid param pre-fills the 3 valid fields only
- [ ] `src/lib/url-params.ts` is the sole implementation of URL param parsing — it is not duplicated elsewhere

---

## Milestone 4 — Runtime API

**Goal:** Feedback submissions reach the server and are stored. The confidence count endpoint is live. (Stats endpoint is deferred per scope challenge Cut 2 — built post-launch.)

M4 runs in parallel with M3. The server and frontend are independent until S-4.3 wires them together.

---

### S-4.1 — Set up the feedback data store

> As a developer, I want a minimal data store for feedback submissions, so that `POST /api/feedback` has somewhere to write.

**Acceptance criteria**
- [ ] A data store exists that can record: `slug`, `outcome` (`success | failure | pending`), `failureReasons[]`, `submittedAt`
- [ ] The store can be queried for a count of successful outcomes per slug (needed for the deferred stats endpoint)
- [ ] The implementation choice (SQLite, Postgres, a hosted DB) is documented in a comment in `server/index.ts`
- [ ] The store is accessible in the test environment (either an in-memory variant or a test database)
- [ ] No PII is stored — the schema contains no user identifiers

---

### S-4.2 — Implement `POST /api/feedback`

> As a developer, I want a feedback endpoint that validates and stores user print outcomes, so that the quality improvement loop has data from day one.

**Acceptance criteria**
- [ ] `POST /api/feedback` accepts `{ slug: string, outcome: "success" | "failure" | "pending", failureReasons?: string[] }`
- [ ] Returns `200 { ok: true }` on success
- [ ] Returns `400` with a descriptive error when `slug` is missing or `outcome` is not one of the three valid values
- [ ] Returns `400` when `failureReasons` is present but `outcome` is not `"failure"`
- [ ] Validates that the submitted `slug` exists in the combination manifest before writing — returns `404` for unknown slugs
- [ ] Rate limiting is applied: no more than 5 submissions per IP per minute
- [ ] An integration test in `tests/integration/feedback.test.ts` covers the happy path and the three error cases above

---

### S-4.3 — Wire the Feedback prompt to the API

> As a user, I want my feedback submission to reach the server, so that my print outcome is recorded.

**Acceptance criteria**
- [ ] Clicking "Yes — it worked" calls `POST /api/feedback` with `outcome: "success"` and the current slug
- [ ] Clicking a failure reason and submitting calls `POST /api/feedback` with `outcome: "failure"` and the selected `failureReasons`
- [ ] Clicking "I haven't printed yet" calls `POST /api/feedback` with `outcome: "pending"` (no failure reasons)
- [ ] If the API call fails (network error, server error), the user sees the same thank-you confirmation — the failure is silent and logged to the browser console
- [ ] No loading state is shown — the confirmation message appears immediately on click; the API call is fire-and-forget

---

## Milestone 5 — Launch Gate

**Goal:** Every combination in the 20-combination launch set has passed a physical test print. The CI pipeline passes. Every item on the pre-launch checklist is signed off.

This milestone has two parallel workstreams: **operational** (physical print testing) and **engineering** (CI setup, E2E tests). The operational workstream is the long pole — it determines the launch date, not the engineering.

---

### S-5.1 — Set up the CI pipeline

> As a developer, I want a CI pipeline that runs on every push, so that a broken build or failing test is caught before it reaches production.

**Acceptance criteria**
- [ ] CI runs on every push to the main branch
- [ ] CI steps in order: `npm install` → `npm run build` → `scripts/build.ts` (engine build) → `npm run test` (Vitest unit + integration) → `npm run test:e2e` (Playwright, headless)
- [ ] A push that breaks the engine build fails CI
- [ ] A push that breaks a Vitest test fails CI
- [ ] A push that breaks a Playwright E2E test fails CI
- [ ] CI results are visible on the repository (pass/fail badge or status check)

---

### S-5.2 — Playwright E2E: primary generate flow

> As a developer, I want an automated test of the full generation journey, so that a regression in the critical path is caught before deployment.

**Acceptance criteria**
- [ ] `tests/e2e/generate-profile.spec.ts` covers: load `/` → click CTA → fill all four inputs → click "Generate profile" → assert correct slug URL → assert profile title renders → assert three highlights render → click "Download profile" → assert import guide becomes visible
- [ ] Test uses a real (or seeded) combination from the manifest
- [ ] Test passes in CI headless mode
- [ ] Test does not depend on network requests (API calls are intercepted or the stats endpoint is not yet live)

---

### S-5.3 — Playwright E2E: feedback, URL pre-fill, unavailable state

> As a developer, I want automated tests for the remaining critical flows, so that the feedback loop and URL contract are covered by regression testing before launch.

**Acceptance criteria**
- [ ] `tests/e2e/feedback.spec.ts`: submits "Yes" (asserts thank-you), submits "No" + selects a failure reason (asserts failure form then thank-you), submits "I haven't printed yet" (asserts not-yet message)
- [ ] `tests/e2e/url-prefill.spec.ts`: navigates to a fully pre-filled URL, asserts generate button is immediately active
- [ ] `tests/e2e/unavailable-combination.spec.ts`: selects a printer, attempts to select a material with no validated combination for that printer, asserts the material is non-interactive and the generate button is disabled
- [ ] All three spec files pass in CI

---

### S-5.4 — Physical validation: Bambu combinations

> As a domain expert, I want all Bambu A1 Mini and Bambu X1C launch combinations physically test-printed, so that profiles shown to users are backed by at least one successful real-world print.

**Note:** This is an operational story. It requires access to a Bambu A1 Mini and a Bambu X1C printer. Each print must use a standard benchmark model (Benchy or calibration cube). Results are recorded in the combination validation runbook (`docs/delivery/combination-validation-runbook.md`).

**Acceptance criteria**
- [ ] All 8 Bambu A1 Mini launch combinations have been printed and the outcome recorded
- [ ] All 8 Bambu X1C launch combinations have been printed and the outcome recorded
- [ ] Any combination with a failed test print has its layer file revised and re-tested before `isAvailable: true` is set
- [ ] The revised build has been run and `generated/combinations.json` reflects the final validated set
- [ ] Each tested combination has a record in the validation runbook: date, printer serial/build, filament brand, outcome, notes

---

### S-5.5 — Physical validation: Prusa and Creality combinations

> As a domain expert, I want all Prusa MK4, Creality Ender 3 V3 SE, and Creality K1 launch combinations physically test-printed.

**Acceptance criteria**
- [ ] All 4 Prusa MK4 launch combinations have been printed and recorded
- [ ] All 4 Creality Ender 3 V3 SE launch combinations have been printed and recorded
- [ ] All 4 Creality K1 launch combinations have been printed and recorded
- [ ] Any failing combination is revised and re-tested before `isAvailable: true` is set
- [ ] Each tested combination has a validation runbook entry

---

### S-5.6 — Pre-launch checklist sign-off

> As a team, we want every item on the pre-launch checklist verified and signed off, so that nothing that was specified as a launch requirement is shipped broken.

**Acceptance criteria**

Each item below must be verified by a person other than the one who built it:

- [ ] All combinations in `generated/combinations.json` with `isAvailable: true` have a validation runbook entry confirming a successful physical test print
- [ ] Every `isAvailable: true` profile file imports into its target slicer without errors (manual import test, one person, all formats)
- [ ] The PrusaSlicer import guide has been tested by a person unfamiliar with PrusaSlicer
- [ ] The Bambu Studio / Orca Slicer import guide has been tested by a person unfamiliar with that slicer
- [ ] The Feedback prompt submits correctly for all three response options on a production-like environment
- [ ] The "No" failure reason flow submits failure reasons to the API and the record appears in the data store
- [ ] Navigating to a valid profile URL, bookmarking it, and returning renders the same page
- [ ] URL pre-fill works for all four query parameters on a production-like environment
- [ ] No required parameter is missing from any generated profile (validated by the build script guardrail pass — zero failures on the final build)
- [ ] Safety parameter guardrails are active and the final build reports zero guardrail violations
- [ ] CI is green on the commit that will be deployed
- [ ] `generated/` is not committed to the repository

---

## Story Map

```
M1 Foundation        M2 Engine               M3 Frontend             M4 API          M5 Launch Gate
─────────────────    ────────────────────    ────────────────────    ────────────    ────────────────────────
S-1.1 Scaffold       S-2.1 Engine types      S-3.1 Home page         S-4.1 Store     S-5.1 CI pipeline
S-1.2 Types          S-2.2 Resolver          S-3.2 Form inputs       S-4.2 Feedback  S-5.2 E2E: primary flow
S-1.3 Skeleton       S-2.3 Validator         S-3.3 Availability      S-4.3 Wire      S-5.3 E2E: other flows
                     S-2.4 Defaults +        S-3.4 Form submit                       S-5.4 Physical: Bambu
                          guardrails         S-3.5 Highlights                        S-5.5 Physical: Prusa +
                     S-2.5 Printer layers    S-3.6 Profile page                           Creality
                     S-2.6 Material +        S-3.7 Download +                        S-5.6 Checklist sign-off
                          goal + nozzle           Import Guide
                     S-2.7 PrusaSlicer ser.  S-3.8 Feedback prompt
                     S-2.8 Bambu/Orca ser.   S-3.9 URL pre-fill
                     S-2.9 Build + manifest
```

---

## What is deferred to Phase 1

These items are explicitly out of scope for the MVP and are not tracked as stories here. They are documented to prevent scope creep.

| Feature | When |
|---|---|
| Stats API (`GET /api/profile/:slug/stats`) and confidence count | Post-launch Week 1 |
| SlicerOverride UI | Phase 1 — if feedback shows demand |
| Email reminder on "Haven't printed yet" path | Phase 1 |
| TPU combinations | Post-launch as physical tests complete |
| Quality goal profiles | Post-launch as physical tests complete |
| Remaining 40 combinations (from full 60) | Post-launch, validated weekly |
| User accounts | Phase 1 |
| Integration tests for API routes | Post-launch Week 2 |
| Analytics instrumentation | Post-launch Week 1 |
