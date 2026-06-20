# Product Backlog

Items identified during delivery but explicitly deferred. Do not implement from this list without a scoped story.

**Last updated:** Product Polish pass (June 2026)

---

## UX & Onboarding

| ID | Item | Rationale for deferral |
|---|---|---|
| UX-1 | Dedicated About page | Home page now covers product explanation, scope, and validation status. Revisit only if navigation depth increases (e.g. accounts, blog). |
| UX-2 | Interactive onboarding tour on Configure page | Adds complexity; URL pre-fill and clearer copy cover the primary confusion points at MVP. |
| UX-3 | Validation status badge per combination (`THEORETICALLY_VALID` / `PHYSICALLY_VALIDATED`) | Requires manifest schema change and PV-1/PV-2 completion. Static copy on profile page is sufficient until physical validation lands. |
| UX-4 | Live print success count on profile pages | Deferred per epic Cut 2 — stats API post-launch Week 1. |
| UX-5 | Printer-specific before-printing tips | Generic guidance is sufficient at MVP; per-printer tips need domain review and manifest or content model. |

---

## Design System

| ID | Item | Rationale for deferral |
|---|---|---|
| DS-1 | Extract shared `Button` / `Card` React components | CSS classes in `src/styles/global.css` cover current needs with zero product logic. Extract when a third consumer or variant set appears. |
| DS-2 | Dark mode | No user demand signal; adds token surface area without MVP validation value. |
| DS-3 | Custom web font | System font stack matches Linear/Railway minimal aesthetic at zero load cost. |

---

## Content & Trust

| ID | Item | Rationale for deferral |
|---|---|---|
| CT-1 | Per-combination validation runbook link on profile page | Operational detail; link when PV-1/PV-2 complete and public transparency is warranted. |
| CT-2 | Profile changelog / version history | Phase 1 trust feature per roadmap. |
| CT-3 | Expand Home "Coming soon" into a public roadmap page | Marketing surface; not required for core generate-download loop. |

---

## Technical

| ID | Item | Rationale for deferral |
|---|---|---|
| TE-1 | Analytics instrumentation (Plausible / PostHog) | Post-launch Week 1 per epic deferred list. |
| TE-2 | SlicerOverride UI | Cut from MVP; add in Phase 1 if feedback shows demand. |
| TE-3 | Email reminder on "Haven't printed yet" | Cut from MVP per epic scope challenge. |

---

## Architecture

Items required to operationalise [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md). None block launch. All are pre-conditions for V2 work.

| ID | Item | Rationale for deferral |
|---|---|---|
| ARCH-1 | Shared canonical JSON profile schema | Required before V2 dynamic generation can be designed. Schema is implicit at MVP; must be made explicit and versioned. |
| ARCH-2 | JSON profile versioning strategy | Needed before feedback (V3) can correlate outcomes to specific parameter snapshots. `schemaVersion` field and migration path must be agreed before V2 ships. |
| ARCH-3 | Import/export compatibility test suite | Round-trip fidelity (canonical JSON → slicer format → re-parsed values) must be verified before dynamic generation serves real users. |
| ARCH-4 | Serializer conformance tests | Each serializer must have tests asserting canonical JSON input produces the correct slicer-native output. Currently tested indirectly via build output snapshots. |
| ARCH-5 | Additional slicer support evaluation | SuperSlicer, ideaMaker, and Cura are candidates. Evaluation is gated on ARCH-1 (a stable canonical schema is a prerequisite for assessing serializer effort). |

---

## V2 Stories — Learning Profiles

Introduces canonical JSON, profile versioning, and feedback-to-version linkage. Depends on ARCH-1 through ARCH-4 being resolved first.

| ID | Goal | Rationale | Dependencies | Estimate |
|---|---|---|---|---|
| V2-1 | Define and publish the canonical JSON profile schema | ARCH-1 backlog item. The schema is currently implicit in the resolver output. Making it explicit and typed is the prerequisite for all V2+ work. | ARCH-1 | M |
| V2-2 | Design and implement JSON profile versioning strategy | ARCH-2 backlog item. Agree on `schemaVersion` field, version identifier format, and schema migration approach before any versioned records are written. | V2-1 | M |
| V2-3 | Refactor serializers to consume typed canonical JSON input | Current serializers receive an untyped `Record<string, unknown>`. This story types the input as the canonical `CanonicalProfile` type defined in V2-1. | V2-1, ARCH-4 | M |
| V2-4 | Build import/export round-trip compatibility test suite | ARCH-3 backlog item. Verifies that canonical JSON → slicer-native format produces a file that imports without error and produces equivalent parameters. | V2-3 | M |
| V2-5 | Upgrade feedback store from append-only JSON to SQLite | `data/feedback.json` cannot support the aggregate queries required by V3. Migrate to a SQLite database using the same `Feedback` schema defined in `future-data-model.md`. | None | M |
| V2-6 | Create `ProfileVersion` records in the build pipeline | For each combination build, persist a `ProfileVersion` record to the SQLite store alongside the static profile files. The canonical JSON document is the record. | V2-2, V2-5 | M |
| V2-7 | Implement `ProfileGeneration` records at download time | Record each download event as a `ProfileGeneration` linking the session to the `ProfileVersion` served. Enables feedback-to-version attribution. | V2-6 | S |
| V2-8 | Link feedback submissions to `ProfileVersion` records | Extend `POST /api/feedback` to resolve the active `ProfileVersion` at submission time and record the foreign key on the `Feedback` record. | V2-6, V2-7 | S |
| V2-9 | Build profile version history view (curator-facing) | A simple interface showing the version history for a given combination: version number, date, source (`manual` / `rule-suggestion`), and parameter diff vs. previous. | V2-6 | L |

---

## V3 Stories — Community Intelligence

Aggregates the feedback history collected in V2 into success rates, confidence scores, and printer/material-level insights.

| ID | Goal | Rationale | Dependencies | Estimate |
|---|---|---|---|---|
| V3-1 | Implement `GET /api/profile/:slug/stats` endpoint | Deferred from MVP (backlog UX-4). Now unblocked by the V2 SQLite feedback store. Returns success/failure counts and success rate for a combination. | V2-5, V2-8 | S |
| V3-2 | Implement confidence scoring algorithm | Define the confidence tier model: how many submissions constitute Low / Medium / High confidence, and what success rate threshold triggers each tier. Document the formula before implementing. | V3-1 | S |
| V3-3 | Wire confidence score to `ProfilePage` UI | Replace the static "be the first to report results" placeholder with the live confidence score from `GET /api/profile/:slug/stats`. Show "Needs more data" below the minimum threshold. | V3-1, V3-2 | S |
| V3-4 | Build printer-family success rate aggregation | Aggregate success rates at the printer family level (Bambu, Prusa, Creality). Expose via a curator-facing internal view. Do not surface publicly until data volume is sufficient. | V3-1 | M |
| V3-5 | Build material-specific success rate aggregation | Aggregate success rates by material type (PLA, PETG, TPU). Expose via the same curator-facing internal view as V3-4. | V3-1 | M |
| V3-6 | Implement threshold alerting for low-success combinations | When a combination's success rate falls below 70% (threshold TBD in V3 scoping) and has ≥ 10 submissions, create a flag record for curator review. | V3-1, V3-2 | M |
| V3-7 | Build internal analytics dashboard | A read-only curator-facing view showing: success rate per combination, confidence tier, flag status, submission count over time. Not user-facing at V3. | V3-4, V3-5, V3-6 | L |

---

## V4 Stories — Assisted Optimization

Adds parameter comparison, outcome correlation, and rule-based tuning suggestions. All suggestions require human approval before any `ProfileVersion` is created.

| ID | Goal | Rationale | Dependencies | Estimate |
|---|---|---|---|---|
| V4-1 | Build `ProfileVersion` side-by-side comparison UI | Show a tabular diff of any two versions for the same combination: which parameters changed, by how much, and in which direction. Suppress unchanged parameters by default. | V2-9 | M |
| V4-2 | Implement parameter impact correlation engine | For each parameter and value-range bucket, compute the observed success rate across all `Feedback` records linked to `ProfileVersion` records where that parameter was in range. Descriptive statistics only — no ML. | V3-1, V2-8 | L |
| V4-3 | Build rule-based tuning suggestion generator | Map common failure reason patterns (from `failureReasons` in Feedback records) to probable causal parameters using a curated lookup table. Produce a suggested parameter adjustment with supporting outcome data. | V4-2 | L |
| V4-4 | Build curator optimization dashboard | A curator-facing interface that shows: open flag alerts (from V3-6), suggested parameter adjustments (from V4-3), correlation data (from V4-2), and a "Create new version" action. | V4-3, V3-7 | L |
| V4-5 | Implement human approval workflow for parameter suggestions | When a curator approves a suggestion, create a new `ProfileVersion` with `source: 'rule-suggestion'` and record who approved it and when. The approval record is mandatory — suggestions cannot self-apply. | V4-4 | M |

---

## V5 Stories — Intelligent Profile Engine

Introduces a learning pipeline and recommendation engine. Human review and physical validation are mandatory safeguards at every stage.

| ID | Goal | Rationale | Dependencies | Estimate |
|---|---|---|---|---|
| V5-1 | Design and agree on training data schema | Define the structured record format for learning: which fields from `ProfileVersion.parameters` and `Feedback` constitute a training example. Document before any pipeline is built. Requires ADR-006 to be approved first. | ADR-006, V2-8 | M |
| V5-2 | Build training data export pipeline | Export structured training records (ProfileVersion params × Feedback outcome) per combination when the submission count exceeds the minimum threshold (indicative: ≥ 1,000 per combination). | V5-1 | M |
| V5-3 | Implement recommendation engine | Consumes the training data export and produces parameter delta suggestions: specific field changes and their expected direction of effect. Does not auto-apply. Suggestions are produced as structured data, not prose. | V5-2 | L |
| V5-4 | Build profile evolution pipeline | When the recommendation engine produces a suggestion, create a `ProfileVersion` candidate with `source: 'ai-recommendation'` and `isActive: false`. The candidate enters the human review queue. | V5-3, V4-5 | M |
| V5-5 | Implement human review workflow for AI-generated candidates | Extend the V4-5 approval workflow to surface AI-generated candidates in the curator dashboard with the supporting recommendation data. Approval sets `isActive: false` with `approvedAt` and `approvedBy` — not yet `isActive: true`. | V5-4, V4-4 | M |
| V5-6 | Enforce physical validation before AI candidates go live | An approved AI-generated `ProfileVersion` candidate cannot be set `isActive: true` until a `ValidationRecord` exists with `printOutcome: 'pass'`. Enforce this at the API level, not just in the UI. | V5-5, V2-6 | M |
| V5-7 | Build audit trail for AI-assisted profile changes | Every `ProfileVersion` created from an AI recommendation must carry a complete provenance record: which recommendation it came from, who approved it, when it was physically validated, and who validated it. Queryable from the curator dashboard. | V5-6 | S |

---

## Related documents

- MVP scope and deferred features: `docs/delivery/epic-mvp.md` (Phase 1 table)
- Physical validation: `docs/decisions/adr-003-deferred-physical-validation.md`
- Canonical profile format decision: `docs/decisions/adr-004-json-as-canonical-profile-format.md`
- Phase 1 roadmap: `docs/discovery/roadmap.md`
- V2–V5 product roadmap: `docs/delivery/roadmap-v2-v5.md`
- Future architecture: `docs/architecture/future-architecture.md`
- Future data model: `docs/delivery/future-data-model.md`
