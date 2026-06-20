# Future Data Model — PrintHub V2–V5

**Date:** 2026-06-21  
**Status:** Planning  
**Relates to:** [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [ADR-003](../decisions/adr-003-deferred-physical-validation.md), [future-architecture.md](../architecture/future-architecture.md), [roadmap-v2-v5.md](./roadmap-v2-v5.md)

> This document describes future entities and their relationships. It is planning documentation only. No database schema, ORM, migration, or TypeScript changes are implemented here. All of those are V2 engineering deliverables, gated on ARCH-1 completion.

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

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique version identifier (e.g. `bambu-a1-mini-pla-04mm-balanced-v3`) |
| `profileId` | `Profile.id` | Parent profile |
| `versionNumber` | `number` | Monotonically increasing per profile; starts at 1 |
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
| `generationId` | `ProfileGeneration.id?` | Optional link to the download event; `undefined` for pre-V2 submissions |
| `profileVersionId` | `ProfileVersion.id?` | Denormalized for query convenience; `undefined` for pre-V2 submissions |
| `slug` | `string` | Combination slug — preserved for backward compatibility with pre-V2 records |
| `outcome` | `enum` | `success` \| `failure` \| `pending` |
| `failureReasons` | `string[]?` | Selected from the preset list in `server/validate-input.ts` |
| `notes` | `string?` | Free-text field — not collected at MVP; may be introduced in V3 |
| `submittedAt` | `string` | ISO 8601 |
| `ipHash` | `string` | Hashed for rate limiting |

**V1 shape (current):** `{ slug, outcome, failureReasons? }` stored as newline-delimited JSON in `data/feedback.json`.

**V2 change:** Persisted to SQLite `feedback` table with `generationId` and `profileVersionId` foreign keys. Existing `feedback.json` records are imported with `generationId: undefined` and `profileVersionId: undefined` to preserve history.

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
