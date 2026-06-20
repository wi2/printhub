# Future Architecture — PrintHub V2–V5

**Date:** 2026-06-21  
**Status:** Planning  
**Relates to:** [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [architecture-overview.md](../delivery/architecture-overview.md), [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md)

> This document describes the intended architecture evolution from V1 (MVP) through V5. It is planning documentation only. No code, schema, or database changes are implemented here.

---

## 1. Current Architecture (V1 MVP)

### Build Pipeline

```
layers/*.yaml
    → scripts/engine/resolve.ts    (pure merge: global → printer → material → goal → nozzle → override)
    → scripts/engine/validate.ts   (guardrail check on 4 parameters)
    → scripts/serializers/         (format-specific translation)
          prusaslicer.ts  → .ini
          bambu-orca.ts   → .3mf
    → generated/profiles/          (static profile files)
    → generated/combinations.json  (manifest: slug, metadata, downloadPath, highlights)
    → public/                      (copied from generated/ for Vite and CDN)
```

### Runtime

```
User browser
    → React SPA (CSR, Vite, React Router)
    → GET /combinations.json      (manifest lookup, module-level cache)
    → GET /profiles/[slug].*      (static profile file download)
    → POST /api/feedback          (outcome report)

Feedback API (Node.js, server/index.ts)
    → validation + rate limiting
    → data/feedback.json          (append-only JSON file)
```

### Structural Characteristics

- Profiles are **pre-generated build artifacts** — never computed at runtime
- No database; all storage is file-based
- No intermediate structured representation between the resolver output and the serializers
- Feedback is **write-only** at MVP — no read path, no analytics query surface
- All state lives in the URL (the combination slug) or in local component state

---

## 2. The ADR-004 Transition — Inserting Canonical JSON

ADR-004 establishes that a canonical JSON document must exist between the resolver output and the serializers. This is the **first structural change** in the roadmap and a prerequisite for all V2+ work.

### V2 Build Pipeline

```
layers/*.yaml
    → scripts/engine/resolve.ts
    → Canonical JSON profile           ← new intermediate artifact (ADR-004)
    →   scripts/serializers/prusaslicer.ts  → .ini
    →   scripts/serializers/bambu-orca.ts   → .3mf
    → ProfileVersion record persisted to store
    → generated/profiles/ + generated/combinations.json
    → public/
```

### Canonical JSON Profile — Illustrative Shape

```json
{
  "schemaVersion": "1.0",
  "slug": "bambu-a1-mini-pla-04mm-balanced",
  "generatedAt": "2026-06-21T00:00:00.000Z",
  "combination": {
    "printer": "bambu-a1-mini",
    "material": "pla",
    "nozzle": "0.4mm",
    "goal": "balanced"
  },
  "parameters": {
    "nozzleTemp": 220,
    "bedTemp": 60,
    "printSpeed": 250,
    "firstLayerSpeed": 50,
    "layerHeight": 0.2
  },
  "validationStatus": "THEORETICALLY_VALID",
  "layerSources": {
    "nozzleTemp": "material",
    "printSpeed": "printer",
    "layerHeight": "goal"
  }
}
```

The `layerSources` map records which layer contributed each parameter. This is included from V2 to enable V4 parameter impact analysis: when a printer layer change affects `printSpeed`, that attribution is preserved in the `ProfileVersion` record.

The `schemaVersion` field is required from day one. When the canonical schema evolves, the version field enables explicit, auditable migrations (ARCH-2).

### What the Serializers Receive (Before and After)

| | V1 (current) | V2 (target) |
|---|---|---|
| **Input type** | Untyped `Record<string, unknown>` from resolver | Typed canonical JSON document (`CanonicalProfile`) |
| **Source of truth** | Implicit in the merge stack | Explicit JSON record with `schemaVersion` |
| **Testable?** | Indirectly via build output snapshots | Directly via ARCH-4 conformance tests |
| **Versionable?** | No | Yes — each build produces a versioned record |

---

## 3. Future Data Flows

### V3 — Feedback Read Path

```
POST /api/feedback ─────────────────────────────────→ Feedback store (SQLite)
                                                              ↓
                                               Aggregation job (scheduled/on-demand)
                                                              ↓
                                               GET /api/profile/:slug/stats
                                                              ↓
                                               ProfilePage (confidence score)
```

The `feedback.json` append-only file is replaced by a SQLite database in V2, enabling the aggregate queries required for V3 stats.

The aggregation job computes per-combination:
- Total submission count
- Success / failure / pending counts
- Success rate = success ÷ (success + failure)
- Confidence tier based on total submission count

### V4 — Analysis Layer

```
Feedback store (SQLite)   }
ProfileVersion store      }  → Outcome correlation engine
                          }         ↓
                            Parameter impact report
                                    ↓
                            Rule-based suggestion generator
                                    ↓
                            Curator approval interface
                                    ↓
                            New ProfileVersion (source: 'rule-suggestion')
```

No machine learning in V4. Correlation is descriptive statistics only: for each parameter and value range bucket, what is the observed success rate across feedback submissions linked to `ProfileVersion` records where that parameter was in range?

### V5 — Learning Pipeline

```
Feedback store + ProfileVersion store
    ↓
Training data export
    (structured records: ProfileVersion params × feedback outcome)
    ↓
Model training (offline batch — not real-time inference)
    ↓
Recommendation engine
    (parameter delta suggestions per combination)
    ↓
Profile evolution pipeline
    (creates ProfileVersion candidates, source: 'ai-recommendation')
    ↓
Human review workflow   ← mandatory; cannot be skipped
    ↓
Physical validation     ← mandatory before PHYSICALLY_VALIDATED
    ↓
Approved + validated ProfileVersion → isActive: true
```

---

## 4. Future Persistence Model

| Layer | V1 (MVP) | V2 | V3 | V4–V5 |
|---|---|---|---|---|
| **Profiles** | Static `.ini` / `.3mf` on CDN | Static files + canonical JSON records | Same | Same |
| **Manifest** | `combinations.json` (static file) | Same, extended with version references | Same | Same |
| **Feedback** | Append-only `feedback.json` | SQLite `feedback` table | SQLite + aggregation views | SQLite + training export pipeline |
| **Profile versions** | None | SQLite `profile_versions` table | Same | Same + `ai_candidates` table in V5 |
| **Validation records** | `combination-validation-runbook.md` (manual doc) | SQLite `validation_records` table (new physical tests) | Same | Same |

**No migration to PostgreSQL is planned for V2–V3.** SQLite is adequate for expected feedback volumes at those phases. The decision to graduate to PostgreSQL is tracked in ADR-005 (PROPOSED) and is gated on observed write volume, concurrent access requirements, and operational complexity.

---

## 5. Profile Lifecycle

### V1 (Current)

```
Author edits layers/*.yaml
    → npm run build:profiles
    → Profile file written to generated/ and public/
    → User downloads from CDN
```

No history. No versioning. The file on disk is the only state.

### V2

```
Author edits layers/*.yaml
    → npm run build:profiles
    → Canonical JSON created (ProfileVersion N)
    → Serialized profile files created
    → ProfileVersion record persisted (version N; previous version N-1 archived, not deleted)
    → User downloads → ProfileGeneration record created (links session to ProfileVersion N)
    → User submits feedback → Feedback record created (links outcome to ProfileGeneration)
```

### V3

```
...V2 flow...
    + Aggregation job reads Feedback → computes success rate per combination
    + GET /api/profile/:slug/stats returns confidence score
    + ProfilePage displays confidence score instead of static placeholder
    + Combinations below success rate threshold flagged for curator review
```

### V4

```
...V3 flow...
    + Curator views diff between ProfileVersion N-1 and N (parameter comparison table)
    + Correlation engine computes outcome change correlated with that diff
    + Rule-based suggestion generator proposes specific parameter adjustments
    + Curator reviews suggestion → approves → new ProfileVersion N+1 created
    + ProfileVersion N+1 carries approval record (who, when, what rationale)
```

### V5

```
...V4 flow...
    + Learning pipeline ingests Feedback × ProfileVersion training data
    + Recommendation engine generates parameter delta for a combination
    + Profile evolution pipeline creates ProfileVersion candidate (source: 'ai-recommendation')
    + Curator reviews candidate in approval interface
    + Approved candidate requires physical test print
    + Physical test passes → ValidationRecord created → ProfileVersion marked PHYSICALLY_VALIDATED
    + ProfileVersion isActive: true → served to users
```

---

## 6. Adding a New Slicer (Post-ADR-004)

ADR-004 makes slicer expansion a bounded, well-defined task:

```
New slicer target (e.g. SuperSlicer)
    → Write one new serializer: scripts/serializers/superslicer.ts
        Input:  CanonicalProfile (typed JSON — the same document all serializers receive)
        Output: Format-specific file
    → Write ARCH-4 conformance tests for the new serializer
    → Register serializer in scripts/build.ts
    → Zero changes to: resolver, validator, canonical JSON schema, other serializers
```

ARCH-5 tracks the evaluation of SuperSlicer, ideaMaker, and Cura as expansion candidates. ARCH-1 (a stable canonical schema) must be complete before ARCH-5 evaluation can begin, since the conformance test pattern depends on the canonical shape.

---

## 7. Rendering Strategy Evolution

ADR-001 deferred SSG to Phase 1. The revisit trigger is defined: combination set expands beyond 20 and organic search becomes a meaningful acquisition channel.

| Version | Rendering | Rationale |
|---|---|---|
| **V1 (MVP)** | CSR (Vite) | No framework migration; SEO delta immaterial at 20 combinations |
| **V2** | CSR or `vite-ssg` | Evaluate before combination set expands; `vite-ssg` is lowest-cost SSG path without framework migration |
| **V3+** | SSG or hybrid (Next.js / Astro) | At 100+ combinations with SEO as an acquisition channel, framework migration is justified |

---

## 8. `src/` Structure Evolution

The current `src/` structure is designed for V1. Anticipated additions by version:

| Addition | Version | Location | Trigger |
|---|---|---|---|
| Profile stats hook | V3 | `src/hooks/useProfileStats.ts` | First shared hook — `src/hooks/` directory created here |
| Admin / curator interface | V4 | `src/pages/admin/` | New route; gated by authentication |
| User accounts (if adopted) | V2–V3 | `src/pages/account/` + `src/stores/` | Zustand added when global user state is needed |
| Additional slicer constants | V2 | `src/types.ts` | Extend `SLICER_FORMATS` constant |
| `src/types.ts` split | When it exceeds ~150 lines | `src/types/domain.ts`, `src/types/manifest.ts` | Mechanical refactor, no semantic change |

---

## 9. What Does Not Change

The following invariants hold across all versions and are not negotiable:

- PrintHub does not store STL files or geometry data (ADR-004 non-goal)
- PrintHub does not become a model or print file repository
- Slicer-native formats (`.ini`, `.3mf`) are outputs only — never inputs to the profile system
- Guardrail validation applies to all profiles regardless of origin (manual, rule-based, or AI-suggested)
- Human review is required before any AI-suggested parameter change becomes an active profile
- Physical validation is required before any profile is marked `PHYSICALLY_VALIDATED`

---

## 10. Related Documents

| Document | Purpose |
|---|---|
| [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) | Establishes canonical JSON; foundation for V2+ |
| [ADR-003](../decisions/adr-003-deferred-physical-validation.md) | Physical validation; governs `ValidationRecord` entity |
| [architecture-overview.md](../delivery/architecture-overview.md) | Current V1 architecture reference |
| [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md) | Product roadmap per version |
| [future-data-model.md](../delivery/future-data-model.md) | Future entity definitions |
| [parameter-schema.md](./parameter-schema.md) | Current 34-parameter set that populates `ProfileVersion.parameters` |
| [profile-persistence.md](./profile-persistence.md) | Current persistence decisions |
| [ADR-005](../decisions/adr-005-data-persistence-strategy.md) (PROPOSED) | When to graduate from SQLite |
| [ADR-006](../decisions/adr-006-feedback-learning-model.md) (PROPOSED) | How feedback informs profile improvements |
