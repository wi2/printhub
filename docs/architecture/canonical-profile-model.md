# Canonical Profile Model

**Date:** 2026-06-21  
**Status:** Implemented (M6)  
**Relates to:** [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md), [parameter-schema.md](./parameter-schema.md), [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md)

---

## Purpose

The canonical profile is the slicer-agnostic, typed JSON representation of a fully resolved print profile. It sits between the layered YAML resolver and the format-specific serializers.

Before M6, resolved parameters flowed directly from the resolver into each serializer as an untyped map. After M6, every build produces a canonical JSON document that is the single source of truth for a combination's parameters. Serializers are output adapters only — they read `CanonicalProfile`, not raw resolver output.

This change is internal. The user-facing application, manifest schema, and download paths are unchanged at M6.

---

## Ownership

| Concern | Owner | Location |
|---|---|---|
| Type definitions | Build pipeline | `scripts/schema/canonical-profile.ts` |
| Profile construction | Pure builder function | `scripts/schema/build-canonical-profile.ts` |
| JSON serialization | Build pipeline | `scripts/schema/serialize-canonical-profile.ts` |
| Parameter completeness | Single source of truth | `scripts/schema/canonical-parameters.ts` |
| Runtime validation | Pure validator | `scripts/schema/validate-canonical-profile.ts` |
| JSON parsing | Pure parser | `scripts/schema/parse-canonical-profile.ts` |
| Slicer output | Serializers | `scripts/serializers/` |
| Parameter namespace | Domain schema | `docs/architecture/parameter-schema.md` |
| Material physical properties | Shared mapping | `scripts/material-properties.ts` (filament density for serializers) |
| Slug construction | Shared utility | `src/lib/slug.ts` (imported by build script, canonical builder, and frontend) |

The canonical profile types live under `scripts/schema/` because they are build-time concerns. They are not imported by the React frontend at M6.

---

## Lifecycle

```
layers/*.yaml
    → scripts/engine/resolve.ts       (merge layers → ResolvedParams)
    → scripts/engine/validate.ts      (guardrail check)
    → buildCanonicalProfile()         (ResolvedParams → CanonicalProfile)
    → serializeCanonicalProfileToJson() → generated/profiles/[slug].json
    → serializers                       → .ini / .3mf
    → generated/combinations.json     (manifest — unchanged)
    → public/                           (copied for CDN / Vite)
```

### Validation lifecycle (V2 Sprint 4)

Any consumer that reads a canonical JSON artifact must validate before use:

```
generated/profiles/[slug].json
    → parseCanonicalProfile(json)       (JSON.parse + validateCanonicalProfile)
    → CanonicalProfile                  (typed, safe for serializers / V3+ workflows)
```

`validateCanonicalProfile(profile: unknown)` accepts parsed JSON and throws descriptive errors on structural failure. `parseCanonicalProfile(json: string)` wraps JSON parsing and delegates to the validator. Both are pure functions with no filesystem access.

**Validation guarantees structural correctness only. It does not validate print quality or physical suitability.** Guardrail bounds are checked at build time by `scripts/engine/validate.ts`; runtime validation enforces document shape, schema version, metadata integrity, and parameter completeness.

### Parsing lifecycle

1. Read JSON string from disk, API response, or in-memory buffer.
2. Call `parseCanonicalProfile(json)`.
3. On success, use the returned `CanonicalProfile` for serialization, diffing, or persistence.
4. On failure, surface the error message — do not attempt to repair or coerce invalid values.

### Schema version governance

`SUPPORTED_SCHEMA_VERSION` (currently `"1.0"`) is defined in `scripts/schema/canonical-profile.ts`. Validation rejects any profile whose `metadata.schemaVersion` does not match this constant.

When the document shape changes:

1. Bump `SUPPORTED_SCHEMA_VERSION` in the same change set as the type and parameter schema updates.
2. Add a migration function in a dedicated story — migrations are not implemented at V2 Sprint 4.
3. Migration strategy (future): read artifact → detect schema version → apply version-specific transform → validate against current schema. Downstream consumers always receive a profile validated against the current `SUPPORTED_SCHEMA_VERSION`.

At M6:

- JSON files are written alongside slicer-native files during `npm run build:profiles`.
- JSON is not served to users or referenced by the manifest.
- No database persistence — files on disk only.
- No versioning beyond the `schemaVersion` field.

---

## Document Shape

```json
{
  "metadata": {
    "schemaVersion": "1.0",
    "slug": "bambu-a1-mini-pla-04mm-balanced",
    "combination": {
      "printer": "bambu-a1-mini",
      "material": "pla",
      "nozzle": "0.4",
      "goal": "balanced"
    }
  },
  "parameters": {
    "nozzleTemp": 215,
    "bedTemp": 55,
    "printSpeed": 200,
    "layerHeight": 0.2
  }
}
```

### Fields included at M6

| Field | Type | Notes |
|---|---|---|
| `metadata.schemaVersion` | `"1.0"` | Required from day one per ADR-004. Must match `SUPPORTED_SCHEMA_VERSION`. Bump when the shape changes. |
| `metadata.version` | `number` | Profile revision for feedback linkage. Positive integer, starts at 1. |
| `metadata.slug` | `string` | Deterministic combination identifier; must match `buildSlug(combination)` |
| `metadata.combination` | object | Printer, material, nozzle, goal IDs |
| `parameters` | object | Full 34-parameter resolved set — keys and types defined in `scripts/schema/canonical-parameters.ts` |

### Fields deliberately omitted at M6

These appear in V2+ planning documents but are not included until their owning stories land:

| Field | Deferred to | Reason |
|---|---|---|
| `generatedAt` | V2 | Omitted for deterministic builds; added with `ProfileVersion` persistence |
| `layerSources` | V2 | Required for V4 parameter impact analysis |
| `validationStatus` | V2 | Requires manifest / UI changes |
| `versionNumber` | V2 | Requires SQLite `ProfileVersion` store |

---

## Relation to ADR-004

[ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) establishes JSON as the canonical internal profile format. M6 is the first engineering deliverable that makes that decision operational:

- **ARCH-1** (shared canonical JSON schema) — addressed by `scripts/schema/canonical-profile.ts`
- **ARCH-4** (serializer conformance tests) — partially addressed; serializers now accept typed input and existing snapshots continue to pass

Remaining ARCH items (versioning strategy, round-trip tests, additional slicer evaluation) are still deferred to V2 scoping.

---

## Relation to V2–V5 Roadmap

| Phase | How canonical JSON is used |
|---|---|
| **M6 (this milestone)** | Build artifact only. JSON written to `generated/profiles/[slug].json`. Serializers consume typed input. No runtime or UI changes. |
| **V2 — Learning Profiles** | `ProfileVersion` records persisted to SQLite; each record is a canonical JSON document. Feedback linked to version ID. |
| **V3 — Community Intelligence** | Stats API aggregates feedback linked to canonical profile versions. |
| **V4 — Assisted Optimization** | Parameter diffs computed between `ProfileVersion` records; `layerSources` added to enable impact analysis. |
| **V5 — Intelligent Engine** | Learning pipeline operates on field values in the canonical schema; AI suggestions expressed as JSON diffs. |

M6 creates the structural foundation. V2 adds persistence, versioning, and feedback linkage on top of the same document shape.

---

## Determinism

Build output must be reproducible. Two constraints enforce this:

1. **No timestamps in canonical JSON** — `generatedAt` is omitted at M6.
2. **Alphabetically sorted parameter keys** — `serializeCanonicalProfileToJson()` sorts keys before writing, so layer merge order does not affect the JSON file.

Slicer-native output determinism is unchanged: `.3mf` archives pin ZIP mtimes to 1980-01-01; `.ini` output has no time-dependent fields.

---

## Related Documents

| Document | Purpose |
|---|---|
| [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) | Decision to adopt canonical JSON |
| [parameter-schema.md](./parameter-schema.md) | 34-parameter namespace |
| [future-architecture.md](./future-architecture.md) | Full architecture evolution |
| [future-data-model.md](../delivery/future-data-model.md) | V2+ entity model (`ProfileVersion`) |
| [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md) | Product roadmap per version |
