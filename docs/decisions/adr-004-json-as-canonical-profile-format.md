# ADR-004 — JSON as Canonical Internal Profile Format

**Date:** 2026-06-21  
**Status:** Accepted  
**Relates to:** `architecture-overview.md` §3, `profile-persistence.md`, ADR-001, ADR-002

---

## Context

PrintHub's current build pipeline generates slicer-specific artifacts from layered YAML configuration files. The engine resolves parameters across the global → printer → material → goal → nozzle → override stack and passes the resolved parameter set directly to format-specific serializers:

- **PrusaSlicer** → `.ini`
- **OrcaSlicer** → `.3mf`
- **Bambu Studio** → `.3mf`

The serializers translate resolved parameters into slicer-native representations. There is no intermediate, slicer-agnostic representation of a fully resolved profile between the resolver output and the serializer input — the resolved parameter map flows directly into each serializer as an untyped record.

This arrangement is sufficient for static profile download at MVP. It becomes a structural liability as the product evolves.

Planned roadmap phases — dynamic profile generation, feedback-driven optimization, community validation, profile versioning, and AI-assisted tuning — all require a stable, inspectable, and machine-readable representation of a profile that is independent of any specific slicer format. Slicer-native formats are not suitable for this role: `.ini` is flat and proprietary; `.3mf` is a zip archive containing printer-vendor extensions. Neither format supports programmatic manipulation, semantic versioning, or comparison across printer families without parsing slicer internals.

Continuing to operate directly on slicer-native formats would require every future feature — optimization, validation, versioning, analytics — to understand and parse at least two distinct slicer formats. That coupling is the core problem this decision resolves.

---

## Decision

**JSON is adopted as the canonical internal profile format.**

A resolved profile is represented as a typed JSON document before any slicer-specific serialization occurs. The serializers consume this JSON document, not the raw resolver output.

The canonical generation flow becomes:

```
Layered YAML (layers/)
    → Resolver (scripts/engine/resolve.ts)
    → Canonical JSON profile
    → Serializer: PrusaSlicer    → .ini
    → Serializer: OrcaSlicer     → .3mf
    → Serializer: Bambu Studio   → .3mf
```

All future profile manipulation — optimization, validation, versioning, feedback aggregation, and AI tuning — operates on the canonical JSON representation. Slicer-native formats are outputs only. No upstream system reads or modifies a `.ini` or `.3mf` in order to produce another profile.

The canonical JSON profile is the single authoritative representation of a combination's resolved parameters at a point in time.

---

## Non-Goals

This decision is scoped to profile parameter data. The following are explicitly outside PrintHub's scope and are not implied by this decision:

- PrintHub does not store STL files or geometry data.
- PrintHub does not become a model repository.
- PrintHub does not persist user-uploaded or user-modified print files.
- PrintHub does not attempt to parse or round-trip existing slicer-native profiles from external sources.
- PrintHub's focus is printer profile generation and optimization only.

---

## Consequences

**Positive:**

- **Slicer-independent architecture.** Profile logic, validation, and optimization operate on one format regardless of how many slicers are supported.
- **Easier slicer support.** Adding a new slicer requires one new serializer. No existing profile data changes.
- **Enables profile versioning.** A JSON document has a defined schema version. Schema migrations are explicit and auditable.
- **Enables feedback-driven optimization.** Feedback outcomes can be correlated with specific field values in the canonical JSON record.
- **Enables AI-assisted tuning.** A structured, typed document is a better input to automated optimization than a flat `.ini` or an opaque `.3mf`.
- **Simplifies testing and validation.** Unit tests assert on a stable JSON structure rather than parsing slicer-native output.

**Negative:**

- **Additional serialization layer.** Serializers must be maintained as the canonical schema evolves. Schema changes require corresponding serializer updates.
- **Exporters must stay aligned.** Any field added to or removed from the canonical JSON schema must be reflected in every serializer that references it. A schema change that goes undetected in one serializer produces a silently incorrect slicer file.
- **Existing serializers may require refactoring.** Current serializers receive a raw resolver output map. Migrating them to accept a typed canonical JSON input is a V2 engineering task.

**M6 operational notes (post-hardening):**

- Slug construction is single-sourced in `src/lib/slug.ts` — the build script, canonical profile builder, and frontend all import this utility.
- Material-specific serializer values (e.g. filament density) live in `scripts/material-properties.ts`, not in individual serializers.
- Parameters such as `motionSystem` are stored in resolved profiles but are not consumed by serializers at launch scope.

---

## Roadmap Impact

| Phase | Dependency on canonical JSON |
|---|---|
| **V2 — Dynamic Profile Generation** | The generation endpoint returns canonical JSON. Clients request a profile by combination slug; the server resolves and serializes on demand. Without a canonical intermediate format, the endpoint must hard-code slicer-specific logic. |
| **V3 — Feedback Engine** | Feedback outcomes (success, failure, notes) are linked to a specific canonical JSON document version. Without versioned JSON records, correlating feedback to the exact parameter values used is not possible. |
| **V4 — Community Validation** | Validation metrics are computed across canonical JSON records from multiple contributors. Comparison and aggregation require a shared schema. Slicer-native formats cannot be aggregated without parsing both formats separately. |
| **V5 — AI Optimization** | An optimization model operates on field values in the canonical JSON schema. Training data, inference inputs, and suggested parameter patches are all expressed as JSON diffs against a canonical baseline. |

---

## Future Work

The following items are required to make this decision operational. They are tracked in [`docs/delivery/backlog.md`](../delivery/backlog.md) under the Architecture section:

| ID | Item |
|---|---|
| ARCH-1 | Define and publish the shared canonical JSON profile schema |
| ARCH-2 | Design a JSON profile versioning strategy (`schemaVersion` field, migration path) |
| ARCH-3 | Build an import/export compatibility test suite verifying round-trip fidelity |
| ARCH-4 | Write serializer conformance tests asserting canonical JSON → slicer-native output |
| ARCH-5 | Evaluate additional slicer support (SuperSlicer, ideaMaker) against the canonical schema |

None of these items are required before launch. They are pre-conditions for V2 work. This ADR establishes the direction; ARCH-1 is the first concrete engineering deliverable when V2 scoping begins.
