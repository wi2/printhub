# Future Data Model — PrintHub V2–V5

**Date:** 2026-06-21  
**Status:** Planning  
**Relates to:** [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [ADR-003](../decisions/adr-003-deferred-physical-validation.md), [future-architecture.md](../architecture/future-architecture.md), [roadmap-v2-v5.md](./roadmap-v2-v5.md)

> This document describes future entities and their relationships. It is planning documentation only. No database schema, ORM, migration, or TypeScript changes are implemented here. All of those are V2 engineering deliverables, gated on ARCH-1 completion.

**V2 Sprint 1 update:** Canonical JSON profiles now include `metadata.version` (integer, initial value `1`). This is the profile version identity field that future `Feedback` records will reference. Version history, SQLite persistence, and queryable `ProfileVersion` records are not yet implemented.

**V2 Sprint 2 update:** Feedback submissions now include `profileVersion` (required integer matching `metadata.version` from the canonical JSON artifact). Records are persisted in the existing JSON file store. Version history, profile evolution, and queryable `ProfileVersion` records remain future work.

**V2 Sprint 3 update:** The build pipeline generates `generated/profile-versions/index.json` — a deterministic Profile Version Registry keyed by slug. Each entry records `currentVersion` and a `versions` list (`version`, `slug`, `status: active`). This registry links build artifacts to the same version identity referenced by `Feedback.profileVersion`. Registry is informational only at V2-S3 and does not yet provide version history management. Future work: preserve superseded versions, attach validation status, and support comparison tooling and analytics.

---

## Overview

The V1 data model is implicit: YAML layer files (parameters), the manifest JSON (combination metadata), and a feedback append-only file (raw submissions). These are sufficient for MVP.

V2–V5 require a richer, explicitly typed entity model. The entities below are the target model. The migration path from MVP structures is described in `future-architecture.md §4`.

---

## Entities

### Printer

Represents a supported printer model.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable identifier (e.g. `bambu-a1-mini`). Matches the directory name in `layers/printers/`. |
| `displayName` | `string` | Human-readable name shown in the UI |
| `manufacturer` | `string` | Brand (e.g. `Bambu Lab`, `Prusa Research`, `Creality`) |
| `motionSystem` | `string` | `CoreXY`, `Cartesian`, `Delta` |
| `slicerFormat` | `string` | `prusaslicer` or `bambu-orca` — determines which serializer output to serve |
| `maxSpeed` | `number` | mm/s — sourced from printer layer YAML |
| `maxAcceleration` | `number` | mm/s² |
| `bedSizeX` | `number` | mm |
| `bedSizeY` | `number` | mm |
| `maxPrintHeight` | `number` | mm |
| `isAvailable` | `boolean` | Whether this printer is included in the active combination set |

**V1 source:** Implicit in `layers/printers/*.yaml` and the `PRINTERS` constant in `src/types.ts`.  
**V2 change:** Extracted as an explicit queryable entity to support printer-specific analytics in V3.

---

### Material

Represents a print material type.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable identifier (e.g. `pla`, `petg`, `tpu`). Matches `layers/materials/` filenames. |
| `displayName` | `string` | Human-readable name |
| `category` | `string` | `filament` at V2; resin support is a post-V5 concern per `docs/discovery/roadmap.md` |
| `nozzleTempRange` | `{ min: number; max: number }` | Safe operational range from guardrails |
| `bedTempRange` | `{ min: number; max: number }` | Safe operational range from guardrails |
| `requiresEnclosure` | `boolean` | Whether an enclosure is strongly recommended |
| `isAvailable` | `boolean` | Whether included in the active combination set |

**V1 source:** Implicit in `layers/materials/*.yaml` and the `MATERIALS` constant in `src/types.ts`.

---

### Profile

Represents the aggregate entity for a specific printer / material / nozzle / goal combination across all time. A Profile has many `ProfileVersion` records. The currently served version is tracked by `activeVersionId`.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | The stable combination slug (e.g. `bambu-a1-mini-pla-04mm-balanced`) |
| `printer` | `Printer.id` | Foreign key |
| `material` | `Material.id` | Foreign key |
| `nozzle` | `string` | `0.4mm`, `0.6mm`, etc. |
| `goal` | `string` | `balanced`, `quality`, etc. |
| `activeVersionId` | `ProfileVersion.id` | The currently served version |
| `isAvailable` | `boolean` | Whether this combination is offered to users |
| `createdAt` | `string` | ISO 8601 — when the Profile was first established |

**V1 equivalent:** Each entry in `generated/combinations.json`.

---

### ProfileVersion

Represents a specific set of resolved parameters for a Profile at a point in time. This is the unit of feedback linkage, parameter comparison, optimization, and learning.

**V2 Sprint 1 foundation:** The canonical JSON `metadata.version` field is the in-artifact representation of `versionNumber`. At build time, all profiles are version `1`. When version history is implemented, each parameter change will increment `metadata.version` and a corresponding `ProfileVersion` record will be persisted.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique version identifier (e.g. `bambu-a1-mini-pla-04mm-balanced-v3`) |
| `profileId` | `Profile.id` | Parent profile |
| `versionNumber` | `number` | Monotonically increasing per profile; starts at 1. **Maps to `metadata.version` in canonical JSON.** |
| `schemaVersion` | `string` | Canonical JSON schema version (e.g. `"1.0"`) |
| `parameters` | `object` | Full 34-parameter resolved set from `parameter-schema.md` |
| `layerSources` | `object` | Maps each parameter name to the layer that contributed it (`global`, `printer`, `material`, `goal`, `nozzle`, `override`) |
| `validationStatus` | `enum` | `THEORETICALLY_VALID` \| `PHYSICALLY_VALIDATED` — from ADR-003 |
| `source` | `enum` | `manual` \| `rule-suggestion` \| `ai-recommendation` |
| `createdAt` | `string` | ISO 8601 |
| `createdBy` | `string` | Curator identifier (human username or system process name) |
| `approvedAt` | `string?` | ISO 8601 — required when `source !== 'manual'` |
| `approvedBy` | `string?` | Curator identifier — required when `source !== 'manual'` |
| `isActive` | `boolean` | Whether this is the currently served version for its Profile |

**V2 introduction.** The canonical JSON document described in ADR-004 maps directly to this entity. The first `ProfileVersion` for each existing combination is created during the V2 migration build.

**Feedback linkage (V2 Sprint 2 foundation):** Feedback records now include `profileVersion` (integer matching `metadata.version` from the canonical JSON artifact at submit time). This enables future analytics to attribute outcomes to a specific profile revision. Queryable `ProfileVersion` records, version history, and profile evolution are not yet implemented. Pre-V2 Sprint 2 feedback cannot be retroactively linked.

**Profile Version Registry (V2 Sprint 3 foundation):** At build time, `generated/profile-versions/index.json` indexes each slug's versions and `currentVersion`. Each registry entry maps to the in-artifact `metadata.version` field. The registry is the build-time counterpart to `Feedback.profileVersion` — both reference the same version integer. Registry is informational only at V2-S3 and does not yet provide version history management. Future validation workflow will attach `ValidationRecord` evidence to specific `ProfileVersion` entries when physical testing upgrades status beyond `THEORETICALLY_VALID`.

**Canonical validation (V2 Sprint 4 foundation):** `scripts/schema/canonical-parameters.ts` defines the 34 required parameter keys and their primitive types. `validateCanonicalProfile()` and `parseCanonicalProfile()` enforce structural correctness before any consumer uses a canonical JSON artifact. Validation checks metadata presence, schema version (`SUPPORTED_SCHEMA_VERSION`), version integer, slug/combination consistency, and parameter completeness (no missing keys, no unknown keys, correct types). **Validation guarantees structural correctness only. It does not validate print quality or physical suitability.** Future schema migrations will transform older artifacts to the current schema before validation — not implemented at V2 Sprint 4.

**Why `layerSources` matters:** In V4, parameter impact analysis needs to know which layer was responsible for a given parameter value. If `printSpeed` changes between versions and outcomes improve, knowing that the printer layer drove that change (not the goal layer) narrows the investigation.

---

### ProfileGeneration

Records each instance of a user generating (downloading) a profile. Links an anonymous session to the specific `ProfileVersion` that was served.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique |
| `profileVersionId` | `ProfileVersion.id` | The version served at download time |
| `sessionId` | `string` | Anonymous session identifier (browser session or device fingerprint) |
| `slicerFormat` | `string` | `prusaslicer` or `bambu-orca` |
| `generatedAt` | `string` | ISO 8601 |
| `ipHash` | `string` | One-way hash of request IP; not raw PII; used for rate limiting and deduplication |

**V2 introduction.**

**No user account required.** `sessionId` is anonymous at V2–V4. If accounts are introduced in V3+, an optional `userId` field may be added — this entity's shape accommodates that without a breaking schema change.

**Enables:** generation funnel analytics, feedback attribution to a specific download event, per-version download counts.

---

### Feedback

Records a user-submitted print outcome for a specific download event.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique |
| `profileVersion` | `number` | **Implemented (V2 Sprint 2).** Matches `metadata.version` from the canonical JSON profile at submit time. Maps to `ProfileVersion.versionNumber` when queryable version records exist. |
| `generationId` | `ProfileGeneration.id?` | Optional link to the download event; `undefined` for pre-V2 submissions |
| `profileVersionId` | `ProfileVersion.id?` | Denormalized for query convenience; `undefined` until queryable `ProfileVersion` records exist |
| `slug` | `string` | Combination slug — preserved for backward compatibility with pre-V2 records |
| `outcome` | `enum` | `success` \| `failure` \| `pending` |
| `failureReasons` | `string[]?` | Selected from the preset list in `server/validate-input.ts` |
| `notes` | `string?` | Free-text field — not collected at MVP; may be introduced in V3 |
| `submittedAt` | `string` | ISO 8601 |
| `ipHash` | `string` | Hashed for rate limiting |

**V1 shape (current through V2 Sprint 1):** `{ slug, outcome, failureReasons?, submittedAt }` stored as JSON in `data/feedback.json`.

**V2 Sprint 2 shape (current):** `{ slug, outcome, failureReasons, profileVersion, submittedAt }` stored as JSON in `data/feedback.json`. `profileVersion` links each submission to the canonical profile revision active at submit time.

**Future V2+ change:** Persisted to SQLite `feedback` table with `generationId` and `profileVersionId` foreign keys. Existing `feedback.json` records are imported with `generationId: undefined` and `profileVersionId: undefined` to preserve history.

---

### ValidationRecord

Records the evidence for a physical validation event that upgrades a `ProfileVersion` from `THEORETICALLY_VALID` to `PHYSICALLY_VALIDATED`. This entity formalises the PV-1/PV-2 process from ADR-003 as a structured, queryable record.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique |
| `profileVersionId` | `ProfileVersion.id` | The version being validated |
| `validatedBy` | `string` | Full name or identifier of the person who performed the test |
| `validatedAt` | `string` | ISO 8601 |
| `hardwareUsed` | `string` | Specific printer model and hardware configuration (nozzle size, bed surface, firmware version) |
| `printOutcome` | `enum` | `pass` \| `fail` \| `partial` |
| `notes` | `string` | Required — must describe what was tested and observed |
| `evidenceUrl` | `string?` | Link to a photograph or video of the test print (optional but strongly encouraged) |

**V2 introduction** — for new `ProfileVersion` records going forward.

**Pre-V2 physical validations** are documented in `combination-validation-runbook.md` as manual records. Those records are not retroactively migrated; the runbook document remains the authority for any validation performed before this entity exists.

---

### UserProfile *(optional — V3+ only)*

Represents a registered user's identity and preferences. This entity is explicitly optional and is not introduced until an account system is adopted. No other entity in this document requires `UserProfile` — the model works fully with anonymous sessions throughout V2–V4.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique |
| `email` | `string` | Authentication identity |
| `displayName` | `string?` | Optional |
| `savedCombinations` | `Profile.id[]` | Slugs the user has saved |
| `reportedPrinters` | `Printer.id[]` | Printer IDs the user has reported using |
| `createdAt` | `string` | ISO 8601 |

**Not implemented at V1, V2, or V3 (unless the account decision is made earlier).** Introducing accounts is a business decision, not an architecture decision. When introduced, `ProfileGeneration` gains an optional `userId` field and `Feedback` gains an optional `userId` field — no schema rebuild is required.

---

## Entity Relationships

```
Printer ──────────┐
Material ─────────┤
Nozzle ───────────┤→ Profile ──────────→ ProfileVersion (1:many, ordered by versionNumber)
Goal ─────────────┘       ↑                     │
                    isAvailable               isActive
                                              layerSources
                                              validationStatus
                                                   │
                                        ProfileGeneration (links download session to version)
                                                   │
                                             Feedback (links outcome to generation)
                                                   │
                                         ValidationRecord (links physical test evidence to version)
```

---

## Migration Path from V1

| V1 artifact | V2+ entity | Migration strategy |
|---|---|---|
| `layers/printers/*.yaml` | `Printer` | YAML remains authoritative for parameters; `Printer` entity extracted for analytics. No YAML change required. |
| `layers/materials/*.yaml` | `Material` | Same — YAML remains authoritative. |
| `generated/combinations.json` entries | `Profile` | One `Profile` record per manifest entry. Manifest remains in use for CDN / frontend. |
| Resolved parameter set (currently implicit) | `ProfileVersion` | First `ProfileVersion` (v1) created per combination during the V2 migration build run. |
| `generated/profile-versions/index.json` | Profile version index | Build-time registry of slug → versions; V2 Sprint 3 foundation. Not served to users. |
| `data/feedback.json` (raw submissions) | `Feedback` | Existing records imported to SQLite with `generationId: undefined` and `profileVersionId: undefined`. |
| `combination-validation-runbook.md` results | `ValidationRecord` | Manual entry for combinations validated before V2. No automated migration. |

---

## What This Document Is Not

- Not a database schema — no SQL DDL, no table definitions.
- Not a TypeScript type file — no code changes.
- Not an API contract — no endpoint definitions.
- Not an ORM model — no Prisma, Drizzle, or similar.

All of the above are V2 engineering deliverables, gated on ARCH-1 (canonical JSON schema) completion.

---

## Related Documents

| Document | Purpose |
|---|---|
| [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) | Foundation for `ProfileVersion` entity |
| [ADR-003](../decisions/adr-003-deferred-physical-validation.md) | Foundation for `ValidationRecord` entity; defines `THEORETICALLY_VALID` / `PHYSICALLY_VALIDATED` |
| [future-architecture.md](../architecture/future-architecture.md) | Architecture evolution context for these entities |
| [roadmap-v2-v5.md](./roadmap-v2-v5.md) | Version-by-version introduction schedule for each entity |
| [parameter-schema.md](../architecture/parameter-schema.md) | The 34-parameter set that populates `ProfileVersion.parameters` |
| [ADR-007](../decisions/adr-007-validation-status-model.md) (PROPOSED) | Extended validation status tiers |
