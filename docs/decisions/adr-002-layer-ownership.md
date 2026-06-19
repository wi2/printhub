# ADR-002 — Layer Ownership: Parameter Assignment by Layer Type

**Date:** 19 June 2026  
**Status:** Accepted  
**Context:** S-2.4 pre-implementation gate  
**Relates to:** `parameter-schema.md`, `engine-approaches.md`

---

## Context

The domain-readiness audit for S-2.4 identified Assumption A as an unresolved design question: the `parameter-schema.md` assigns `printSpeed` and `firstLayerSpeed` as "set by the goal layer," but this conflicts with the reality that optimal balanced print speeds are printer-specific — a Bambu A1 Mini (CoreXY, AVC) and a Creality Ender 3 V3 SE (Cartesian, no vibration compensation) have fundamentally different safe balanced speeds.

If the goal layer owns `printSpeed`, then:
- Balanced goal must set a single universal speed that works for all five printers, which means either under-performing Bambu machines (set low) or over-stressing Creality machines (set high).
- There is no mechanism for the Balanced goal to express "use the printer's preferred balanced speed."

A second issue involves `travelSpeed`: the schema assigns it to the printer layer, but this was not articulated as an explicit decision.

---

## Decision

**The printer layer owns `printSpeed`, `firstLayerSpeed`, and `travelSpeed`.  
The goal layer owns quality/performance modifiers only.**

Concretely:

| Parameter | Previous convention | Decision | Rationale |
|---|---|---|---|
| `printSpeed` | goal layer | **printer layer** | Optimal balanced speed is a hardware capability, not a quality preference |
| `firstLayerSpeed` | goal layer | **printer layer** | First-layer adhesion performance is printer-dependent |
| `travelSpeed` | printer layer | **printer layer** | No change; confirmed as correct |
| `externalPerimeterSpeed` | goal layer | **goal layer** | Quality preference — outer wall speed trades against surface finish |
| `infillSpeed` | goal layer | **goal layer** | Quality preference — infill speed trades against print time |

The goal layer interacts with speed as follows:

- **Balanced goal** — does not set `printSpeed` or `firstLayerSpeed`. Each printer runs at its own authoring-time balanced speed from the printer layer.
- **Quality goal** — explicitly sets `printSpeed: 80` and `firstLayerSpeed: 20`, overriding the printer layer value via the resolution order (goal is more specific than printer). This enforces a universal quality print speed across all five printers, which is the correct behaviour: quality printing is slow regardless of hardware capability.

This design uses the existing resolution order (global → printer → material → goal → nozzle → override) without any engine changes. The goal layer's higher specificity than the printer layer is the mechanism; no new concept is introduced.

---

## Layer ownership summary (complete)

| Parameter group | Layer | Parameters |
|---|---|---|
| Printer characteristics | **printer** | `firmwareFlavor`, `motionSystem`, `bedSizeX`, `bedSizeY`, `maxPrintHeight`, `maxSpeed`, `maxAcceleration`, `travelSpeed`, `printSpeed`, `firstLayerSpeed` |
| Temperatures | **material** | `nozzleTemp`, `firstLayerNozzleTemp`, `bedTemp`, `firstLayerBedTemp` |
| Cooling | **material** | `fanSpeed`, `fanSpeedMin`, `fanKickInLayer` |
| Retraction | **material** | `retractLength`, `retractSpeed`, `deretractSpeed` |
| Layer geometry (quality) | **goal** | `layerHeight`, `firstLayerHeight`, `externalPerimeterSpeed`, `infillSpeed` |
| Shell and infill | **goal** | `perimeterCount`, `topSolidLayers`, `bottomSolidLayers`, `infillDensity`, `infillPattern`, `supportEnabled` |
| Speed override (quality only) | **goal** | `printSpeed`, `firstLayerSpeed` (Quality goal only — overrides printer layer) |
| Nozzle geometry | **nozzle** | `nozzleDiameter`, `lineWidth`, `minLayerHeight`, `maxLayerHeight`, `maxVolumetricSpeed` |
| Global fallbacks | **global defaults** | All 34 parameters — conservative values that the relevant specific layer always overrides |

---

## Consequences

**Positive:**
- Each printer in `layers/printers/*.yaml` has a single authoring-time balanced speed that reflects actual tested performance on that hardware.
- The Balanced goal layer contains no speed parameters, making its intent ("quality and performance modifiers only") unambiguous.
- The Quality goal's universal speed override is explicit and auditable: one value in `goals/quality.yaml` enforces slow printing on all printers without per-printer override files.
- Adding a new printer requires one file — no goal layer changes needed.

**Trade-off accepted:**
- The Quality goal sets an absolute `printSpeed: 80` rather than a percentage of the printer's balanced speed. If the Bambu X1C can print Quality at 120mm/s and produce better results than 80mm/s, the Quality goal file must be updated globally or a combination override added. This is acceptable at MVP (one printer, one material, one quality goal per combination at a time) and is a known candidate for Phase 1 improvement.

**Not changed:**
- The `parameter-schema.md` description "Set by the goal layer" for `printSpeed`/`firstLayerSpeed` remains a documentation gap. It will be corrected when `parameter-schema.md` is next revised. This ADR is the authoritative decision until then.
- The resolver (`scripts/engine/resolve.ts`) requires no changes — this is a data authoring decision, not an engine change.
- The validator (`scripts/engine/validate.ts`) requires no changes.
