# PrintHub Roadmap — V2 to V5

**Date:** 2026-06-21  
**Status:** Planning  
**Relates to:** [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [docs/discovery/roadmap.md](../discovery/roadmap.md), [backlog.md](./backlog.md)

---

## 1. Product Vision

PrintHub's long-term mission is to be the intelligent bridge between "I have a printer and a material" and "I have a print that looks right." The MVP establishes the foundation: a curated, statically generated set of validated profiles covering the most common printer/material/goal combinations.

The V2–V5 roadmap transforms PrintHub from a **static profile catalogue** into a **continuously learning profile engine** — one that improves with every print outcome reported, accumulates community knowledge, and eventually offers data-driven optimization suggestions.

All four phases build on a single invariant established by ADR-004: **profiles are always represented as canonical JSON internally.** Every V2–V5 feature is either impossible or disproportionately expensive to build without that intermediate representation.

---

## 2. Roadmap Overview

```
V1 (MVP)   →   V2   →   V3   →   V4   →   V5
Static       Learning  Community  Assisted  Intelligent
Profiles     Profiles  Intel.     Optim.    Engine
```

| Version | Theme | Core Capability Introduced |
|---|---|---|
| **V1 (MVP)** | Static profiles | Build-time generation, 20 combinations, static download |
| **V2** | Learning profiles | Canonical JSON, profile versioning, feedback-linked history |
| **V3** | Community intelligence | Aggregated success rates, confidence scoring, printer/material insights |
| **V4** | Assisted optimization | Parameter comparison, tuning suggestions, curator impact analysis |
| **V5** | Intelligent profile engine | Learning pipeline, recommendation engine, human-validated AI suggestions |

**Relationship to the discovery roadmap:** `docs/discovery/roadmap.md` describes Phase 0–4 at a product level. This document maps those phases to V1–V5 engineering milestones and adds the architectural specifics required to plan and scope each version.

---

## 3. V2 — Learning Profiles

### Theme

Give every profile a stable identity and a history. Link user feedback to the exact version of parameters used. Enable profile authors to understand how changes affect outcomes over time.

### Objectives

1. **Canonical JSON as the intermediate format** — every resolved profile exists as a typed, versioned JSON document before serialization (ARCH-1, ARCH-2 from backlog; required by ADR-004) — **implemented at M6**
2. **Profile version identity** — each canonical JSON profile carries a `metadata.version` field (integer, starts at 1); deterministic, no timestamps — **implemented (V2 Sprint 1)**
3. **Profile version registry** — build-time `generated/profile-versions/index.json` indexes each slug's versions and `currentVersion`; informational only at V2 Sprint 3 — **implemented (V2 Sprint 3 foundation)**
4. **Profile versioning** — each time a combination's parameters change, a new `ProfileVersion` is created; old versions are preserved and queryable — **not yet implemented**
5. **Feedback linkage** — every feedback submission references the profile version (`metadata.version`) that was active when the profile was viewed — **implemented (V2 Sprint 2 foundation)**
6. **Profile generation history** — the system records which `ProfileVersion` was served to each generation request — **not yet implemented**
7. **Profile evolution view** — profile authors can compare two `ProfileVersion` records side-by-side — **not yet implemented**

### Architecture Changes Required

Current build pipeline (V1):

```
Layered YAML → Resolver → Serializers → Static files
```

V2 build pipeline:

```
Layered YAML
    → Resolver
    → Canonical JSON profile   ← new intermediate step (ADR-004)
    →   Serializer: PrusaSlicer    → .ini
    →   Serializer: OrcaSlicer     → .3mf
    → Profile Version Registry (generated/profile-versions/index.json)   ← V2 Sprint 3
    → ProfileVersion record persisted to store   ← future
    → Static files written to generated/
```

**V2 Sprint 3 note:** The Profile Version Registry is generated at build time and is informational only. It does not yet provide version history management, SQLite persistence, or runtime consumption. Registry is informational only at V2-S3 and does not yet provide version history management.

### Dependencies

| Dependency | Tracks |
|---|---|
| ARCH-1: Canonical JSON schema defined | Required before any V2 story begins |
| ARCH-2: Versioning strategy agreed | Required before V2 profile records are created |
| ARCH-3: Round-trip compatibility tests | Required before V2 profiles serve real users |
| ARCH-4: Serializer conformance tests | Required before V2 serializer refactor is considered safe |
| Feedback store upgrade (JSON file → SQLite) | Required before feedback-to-version linkage works |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Canonical schema is too narrow and requires breaking changes soon after adoption | Medium | High | Use `schemaVersion` field from day one (ARCH-2); design for forward migration from the start |
| Serializer refactoring introduces silent regressions | Medium | High | ARCH-4 conformance tests must exist and pass before any V2 profile is served |
| Feedback data accumulated at MVP cannot be retroactively linked to a specific version | High | Medium | Accept this loss; document the cut-off date; post-V2 feedback is fully linked |

### Success Metrics

- 100% of V2+ profiles have a canonical JSON record with a `schemaVersion` field — **met at M6**
- 100% of V2+ profiles have a `metadata.version` field — **met at V2 Sprint 1**
- 100% of launch profiles appear in `generated/profile-versions/index.json` with `currentVersion` and `status: active` — **met at V2 Sprint 3**
- 100% of post-V2 Sprint 2 feedback submissions include `profileVersion` linked to `metadata.version`
- Profile authors can view a parameter diff between any two versions of a combination
- Zero serializer regressions in the ARCH-4 conformance suite

---

## 4. V3 — Community Intelligence

### Theme

Accumulate enough real-world outcome data to compute meaningful success rates per combination. Surface printer-specific and material-specific insights. Give users a confidence signal that tells them how well-tested a profile is.

### Objectives

1. **Stats API** — queryable endpoint returning success/failure counts per combination, backed by V2 feedback records
2. **Confidence scoring** — a score derived from submission count and outcome distribution; displayed on profile pages
3. **Aggregated insights** — success rates broken down by printer family and material type (internal curator views first, user-facing later)
4. **Threshold alerting** — flag combinations whose reported success rate falls below an acceptable threshold for curator review
5. **Public confidence display** — replace the static "be the first to report results" placeholder with real data

### Architecture Changes Required

V3 adds a read path to the V2 feedback store:

```
POST /api/feedback → Feedback store (SQLite)
                          ↓ (scheduled or on-demand aggregation job)
                   GET /api/profile/:slug/stats
                          ↓
                   ProfilePage (confidence score UI)
```

The aggregation job can run on a schedule (e.g. hourly) or inline on the stats endpoint at expected V3 query volume.

### Dependencies

| Dependency | Tracks |
|---|---|
| V2 complete | Feedback-to-version linkage is required for per-version confidence scores |
| SQLite feedback store (V2) | File-based store cannot support aggregate queries |
| Minimum feedback volume | Stats are only displayed above a threshold (e.g. ≥ 10 submissions) |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Insufficient feedback volume at V3 launch to compute meaningful scores | High | Medium | Display a "Needs more data" state below the minimum threshold |
| Success rate metric is gamed by coordinated false reports | Low | Medium | Rate limiting (already in place), session-level deduplication added in V3 |
| Printer-family insights require more data than available per model | Medium | Low | Aggregate at brand family level first; per-model breakdown only when n ≥ threshold |

### Success Metrics

- Stats API responds in under 200 ms at expected V3 query volume
- All profile pages with ≥ 10 feedback submissions display a confidence score
- Combinations with a success rate below 70% trigger a curator review flag
- At least one material-level and one printer-family insight are computed and surfaced internally

---

## 5. V4 — Assisted Optimization

### Theme

Give profile curators the data they need to make informed parameter decisions. Surface which parameter changes correlated with improved outcomes. Enable systematic comparison between profile versions.

### Objectives

1. **Profile version comparison** — side-by-side diff of any two `ProfileVersion` records for the same combination
2. **Parameter impact analysis** — descriptive correlation between specific parameter changes and feedback outcome shifts (no predictive ML at this phase)
3. **Rule-based tuning suggestions** — suggestions for parameter adjustments derived from failure reason patterns in feedback
4. **Curator recommendation interface** — a view that proposes specific parameter changes with supporting outcome data, requiring explicit human approval before a new `ProfileVersion` is created

### Architecture Changes Required

V4 adds an analysis layer over the V3 data:

```
Feedback store (V3 SQLite)    }
ProfileVersion store (V2)     }  → Outcome correlation engine
                              }       ↓
                                Parameter impact report
                                       ↓
                                Rule-based suggestion generator
                                       ↓
                                Curator approval interface
                                       ↓
                                New ProfileVersion (source: 'rule-suggestion')
```

No machine learning is introduced in V4. All suggestions are derived from:
- Aggregate outcome statistics by parameter value range
- Rule-based mapping from failure reason to likely causal parameters
- Version diff correlated with outcome changes after the diff was applied

### Dependencies

| Dependency | Tracks |
|---|---|
| V3 confidence scoring | Provides the outcome signal for correlation analysis |
| V2 profile versioning | Provides the parameter history for comparison |
| Minimum feedback volume per combination | Exact threshold defined during V4 scoping; indicative ≥ 30 reports |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Parameter correlations are spurious at low data volume | High | Medium | Show correlation confidence alongside suggestions; suppress below minimum n |
| Curators over-trust automated suggestions and ship regressions | Medium | High | All tuning suggestions require explicit human approval; the approval record is mandatory |
| Version diff UI grows unwieldy for 34-parameter sets | Medium | Low | Start with a simple tabular diff; suppress unchanged parameters by default |

### Success Metrics

- Curators can compare any two `ProfileVersion` records without leaving the admin interface
- At least one successful parameter improvement per calendar quarter is attributed to an optimization suggestion
- 100% of rule-based suggestions require human approval before becoming an active `ProfileVersion`

---

## 6. V5 — Intelligent Profile Engine

### Theme

Build a principled learning system that can improve profile quality beyond what manual curation achieves at scale. Maintain human review as a mandatory, non-negotiable safeguard at every step.

### Objectives

1. **Learning pipeline** — ingests feedback outcomes and profile parameters as training signal; produces parameter adjustment recommendations
2. **Recommendation engine** — generates specific parameter delta suggestions from learned patterns
3. **Profile evolution pipeline** — automates the creation of `ProfileVersion` candidates from recommendations
4. **Validation workflow** — every AI-generated `ProfileVersion` candidate goes through a documented review before becoming active
5. **Mandatory human sign-off** — no AI recommendation is promoted to a live profile without explicit curator approval and physical test evidence

### Architecture Changes Required

V5 extends the V4 analysis layer with a learning component:

```
Feedback store + ProfileVersion store
    ↓
Training data export (structured records per version × outcome)
    ↓
Model training (offline batch — not real-time)
    ↓
Recommendation engine (parameter delta suggestions)
    ↓
Profile evolution pipeline (creates ProfileVersion candidates)
    ↓
Human review workflow (mandatory)
    ↓
Physical validation (mandatory before PHYSICALLY_VALIDATED status)
    ↓
Approved and validated ProfileVersion → Live profile
```

The learning model is intentionally scoped to **parameter optimization within the existing canonical JSON schema**. It does not generate new parameter types, introduce new printers, or modify guardrail bounds.

### Human Review Requirement

This is a non-negotiable safeguard for V5. The system proposes; humans decide.

- Every AI-generated `ProfileVersion` candidate carries `source: 'ai-recommendation'`
- Candidates require explicit curator approval before `isActive: true` is set
- Approved candidates require at least one physical test print before being marked `PHYSICALLY_VALIDATED`
- The approval record (who, when, what evidence) is persisted alongside the `ProfileVersion`
- Guardrail validation applies to all AI-generated candidates; out-of-bounds suggestions are rejected automatically before they reach human review

### Dependencies

| Dependency | Tracks |
|---|---|
| V4 complete | Parameter impact analysis and the approval UI are the human validation layer for V5 candidates |
| ADR-006 (Feedback Learning Model) approved | Must be approved before V5 implementation begins |
| Minimum training data volume | Indicative target: ≥ 1,000 feedback submissions per combination before the learning pipeline activates for that combination |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Learning system produces unsafe parameter recommendations | Low | Critical | Existing guardrail validation applies to all candidates; out-of-bounds suggestions are rejected automatically |
| Training data is too sparse for reliable signal | High | Medium | Rule-based fallback from V4 remains live; learning only activates per combination when threshold is met |
| Human review becomes a bottleneck as recommendation volume grows | Medium | Medium | Invest in review UI before scaling; the review step is intentional friction |
| Model overfits to a specific slicer version's quirks | Low | Medium | Canonical JSON is slicer-agnostic; the model operates on parameters, not slicer output |

### Success Metrics

- Zero AI-generated profiles are served without a curator approval record and a physical validation record
- At least three combinations have a V5-assisted `ProfileVersion` with documented physical validation
- The learning pipeline activates for any combination with ≥ 1,000 feedback submissions
- Guardrail validation rejects 100% of out-of-bounds AI suggestions before they reach human review

---

## 7. Cross-Version Dependency Map

```
V1 (MVP) prerequisites for V2:
  ARCH-1  Canonical JSON schema defined
  ARCH-2  Versioning strategy agreed
  ARCH-3  Round-trip compatibility tests pass
  ARCH-4  Serializer conformance tests pass

V2 prerequisites for V3:
  SQLite feedback store
  ProfileVersion records per combination
  Feedback-to-version linkage

V3 prerequisites for V4:
  Stats API operational
  Confidence scoring algorithm agreed
  Minimum feedback volume accumulated

V4 prerequisites for V5:
  Parameter impact analysis implemented
  Human approval workflow implemented
  ADR-006 (Feedback Learning Model) approved
```

---

## 8. Architecture Evolution Summary

| Version | Profile Store | Feedback Store | Analysis | Optimization |
|---|---|---|---|---|
| **V1 (MVP)** | Static files on CDN | Append-only `feedback.json` | None | Manual curation |
| **V2** | Canonical JSON + static files | SQLite | None | Manual curation on versioned data |
| **V3** | Canonical JSON + static files | SQLite + aggregation | Success rates, confidence scores | Manual curation guided by data |
| **V4** | Canonical JSON + static files | SQLite + correlation engine | Parameter impact analysis | Rule-based suggestions, human-approved |
| **V5** | Canonical JSON + static files | SQLite + training pipeline | ML-assisted suggestions | AI recommendations, human-approved + physically validated |

---

## 9. Risks Common to All Phases

| Risk | Impact | Mitigation |
|---|---|---|
| Slicer format changes break serializers | High | ARCH-4 conformance tests run on every release; pin to tested slicer versions |
| Physical validation remains unavailable | High | All V2+ `ProfileVersion` records still require `PHYSICALLY_VALIDATED` before serving; ADR-003 protocol applies |
| Feedback volume lower than expected | Medium | Design for low-volume gracefully; "Needs more data" states are not error states |
| Canonical JSON schema requires breaking changes mid-roadmap | High | Enforce `schemaVersion` from ARCH-1 day one; migration utilities agreed in ARCH-2 |
| Curated quality degrades under optimization pressure | Medium | Human review is mandatory at V4 and V5; this is never automated away |

---

## 10. Related Documents

| Document | Purpose |
|---|---|
| [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) | Foundation for all V2+ work |
| [docs/discovery/roadmap.md](../discovery/roadmap.md) | Original Phase 0–4 product roadmap |
| [docs/delivery/backlog.md](./backlog.md) | V2–V5 story backlog |
| [docs/architecture/future-architecture.md](../architecture/future-architecture.md) | Technical architecture evolution |
| [docs/delivery/future-data-model.md](./future-data-model.md) | Future entity model |
| [ADR-005](../decisions/adr-005-data-persistence-strategy.md) (PROPOSED) | When to graduate from SQLite |
| [ADR-006](../decisions/adr-006-feedback-learning-model.md) (PROPOSED) | How feedback informs profile improvements |
| [ADR-007](../decisions/adr-007-validation-status-model.md) (PROPOSED) | Extended validation status model |
