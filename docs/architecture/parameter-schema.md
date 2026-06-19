# Parameter Schema — Slicer Profile Generator

**Version:** 1.0  
**Status:** Approved for M2 delivery  
**Scope:** MVP — 5 printers, 3 materials, 2 nozzle sizes, 2 goals  
**Input documents:** `engine-approaches.md`, `folder-structure.md`, `scripts/engine/types.ts`

---

## Purpose

This document defines the canonical, slicer-agnostic parameter namespace used throughout the
profile engine. It is the shared contract between three independent systems:

- **Layer YAML files** — authored by domain experts; keys must match this namespace exactly
- **Guardrail validator** — checks safety-critical parameter values against defined bounds
- **Serializers** — translate this namespace into slicer-specific key names and file formats

Any key that appears in a layer file must appear in this document. Any key the validator or a
serializer references must appear in this document. If a key is not here, it does not exist in
the system.

---

## Rules

**Naming:** camelCase. No abbreviations except widely-understood 3D printing terms (`PLA`,
`PETG`, `mm`, `°C`). Names are descriptive and self-documenting when read in isolation.

**Slicer-agnostic:** Keys describe the parameter's function, not its slicer-specific name.
`nozzleTemp` is the internal name regardless of whether PrusaSlicer calls it `temperature`
or Bambu Studio calls it `nozzle_temperature`. Mapping to slicer-specific names is the
serializer's sole responsibility.

**Types:** Each parameter has exactly one value type — `number`, `string`, or `boolean`.
Mixed-type parameters do not exist. The resolver merges layers without type coercion; the
serializer is responsible for any type conversion needed by the target format.

**Primary layer:** Each parameter lists the layer that typically sets it. This is a
authoring convention, not an engine constraint. Any layer can set any parameter. The resolution
order (global → printer → material → goal → nozzle → override) determines which value wins.

**Defaults:** This document does not define values. Default values live in
`layers/global-defaults.yaml`. Bounds for safety-critical parameters live in
`layers/guardrails.yaml`.

---

## Parameters

### Printer characteristics

Set by the printer layer. These values are fixed for a given printer regardless of
material, goal, or nozzle.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `firmwareFlavor` | string | printer | GCode dialect used by this printer's firmware. Values: `"marlin"`, `"klipper"`, `"bambu"`. Controls gcode syntax in PrusaSlicer profiles. Not emitted in Bambu/Orca profiles (the machine profile already encodes this). |
| `motionSystem` | string | printer | Kinematic architecture. Values: `"cartesian"`, `"corexy"`, `"corexz"`. Used by serializers to select appropriate acceleration/jerk mappings. |
| `bedSizeX` | number | printer | Usable bed dimension along X axis in mm. |
| `bedSizeY` | number | printer | Usable bed dimension along Y axis in mm. |
| `maxPrintHeight` | number | printer | Maximum usable Z height in mm. |
| `maxSpeed` | number | printer | Printer's absolute maximum movement speed in mm/s. Used by the guardrail validator as the upper bound for `printSpeed` and `travelSpeed`. |
| `maxAcceleration` | number | printer | Printer's maximum acceleration in mm/s². Referenced by serializers for machine profile limits. |
| `travelSpeed` | number | printer | Non-extrusion travel speed in mm/s. Set per-printer because it is constrained by the motion system's ringing characteristics. |

---

### Temperatures

Set by the material layer. Bounds for `nozzleTemp` and `bedTemp` are enforced by the
guardrail validator against the per-material limits in `layers/guardrails.yaml`.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `nozzleTemp` | number | material | Nozzle temperature during printing in °C. Guardrail-validated per material. |
| `firstLayerNozzleTemp` | number | material | Nozzle temperature for the first layer in °C. Typically equal to or slightly higher than `nozzleTemp` for better first-layer adhesion. |
| `bedTemp` | number | material | Heated bed temperature during printing in °C. Guardrail-validated per material. |
| `firstLayerBedTemp` | number | material | Bed temperature for the first layer in °C. Typically equal to or slightly higher than `bedTemp`. |

---

### Cooling

Set by the material layer. Fan speed is material-specific — PLA runs with full cooling,
PETG and TPU require reduced or no active cooling to prevent layer delamination and warping.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `fanSpeed` | number | material | Maximum cooling fan speed as a percentage (0–100). |
| `fanSpeedMin` | number | material | Minimum cooling fan speed as a percentage (0–100). The fan does not drop below this value when cooling is active. |
| `fanKickInLayer` | number | material | Layer number at which the cooling fan activates. For materials that need a warm first layer (e.g. PETG, TPU), set to 3 or higher to prevent the first layer from cooling too quickly. |

---

### Speeds

`printSpeed` and `firstLayerSpeed` are set by the goal layer. The guardrail validator
checks both against per-printer bounds in `layers/guardrails.yaml`. `externalPerimeterSpeed`
and `infillSpeed` are derived from `printSpeed` in the global defaults; goal or override
layers can set them explicitly to override the derivation.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `printSpeed` | number | goal | General print speed in mm/s. Applies to inner walls and most moves unless overridden by a more specific speed parameter. Guardrail-validated per printer. |
| `firstLayerSpeed` | number | goal | Print speed for the first layer in mm/s. Lower than `printSpeed` to improve bed adhesion. Guardrail-validated per printer. |
| `externalPerimeterSpeed` | number | goal | Outer wall speed in mm/s. Lower than `printSpeed` for better surface quality. |
| `infillSpeed` | number | goal | Infill speed in mm/s. Typically higher than `printSpeed` because infill quality is less critical than walls. |

---

### Layer geometry

Set by the goal layer. Nozzle-specific constraints (`maxLayerHeight`, `minLayerHeight`)
are set by the nozzle layer and may override the goal layer value if the goal layer sets
a value outside the nozzle's valid range.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `layerHeight` | number | goal | Standard layer height in mm. |
| `firstLayerHeight` | number | goal | First layer height in mm. Typically equal to `layerHeight`; may be set higher for better bed adhesion on smooth surfaces. |
| `minLayerHeight` | number | nozzle | Minimum layer height this nozzle can reliably extrude in mm. |
| `maxLayerHeight` | number | nozzle | Maximum layer height this nozzle can print without under-extrusion in mm. Typically 75% of nozzle diameter. |

---

### Nozzle and extrusion

Set by the nozzle layer.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `nozzleDiameter` | number | nozzle | Nozzle orifice diameter in mm. |
| `lineWidth` | number | nozzle | Extrusion line width in mm. Typically 100–120% of `nozzleDiameter`. |
| `maxVolumetricSpeed` | number | nozzle | Maximum volumetric extrusion rate in mm³/s. Limits how fast material can be pushed through this nozzle for a given material. |

---

### Shell and infill

Set by the goal layer.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `perimeterCount` | number | goal | Number of perimeter / wall loops. |
| `topSolidLayers` | number | goal | Number of solid top layers. |
| `bottomSolidLayers` | number | goal | Number of solid bottom layers. |
| `infillDensity` | number | goal | Infill density as a percentage (0–100). |
| `infillPattern` | string | goal | Infill pattern identifier. Values: `"gyroid"`, `"honeycomb"`, `"lines"`, `"grid"`, `"triangles"`. |

---

### Retraction

Set by the material layer. Retraction requirements are highly material-dependent — TPU
requires minimal retraction (or none) to avoid jamming; PETG requires careful tuning to
prevent stringing; PLA tolerates a wide range.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `retractLength` | number | material | Retraction distance in mm. |
| `retractSpeed` | number | material | Retraction speed in mm/s. |
| `deretractSpeed` | number | material | Deretraction (un-retract) speed in mm/s. Often slower than retraction speed to reduce blobbing. |

---

### Support

Set by the goal layer. At MVP, the Balanced goal does not enable supports by default.
The `supportEnabled` parameter is defined here so override files can activate supports
for specific combinations that require them.

| Key | Type | Primary layer | Description |
|---|---|---|---|
| `supportEnabled` | boolean | goal | Whether support structures are generated automatically. |

---

## Guardrail-validated parameters

The following parameters are checked by the guardrail validator against bounds defined
in `layers/guardrails.yaml`. A resolved parameter map that contains any of these outside
their per-material or per-printer bounds is rejected and does not enter the manifest.

| Parameter | Bound type | Notes |
|---|---|---|
| `nozzleTemp` | per-material | Prevents material degradation or thermal runaway |
| `bedTemp` | per-material | Prevents warping risk from excessive bed temps |
| `printSpeed` | per-printer | Prevents motion artifacts and mechanical stress |
| `firstLayerSpeed` | per-printer | Prevents bed adhesion failure from excessive speed |

These four match the `GuardrailBounds` type already defined in `scripts/engine/types.ts`.
If additional safety-critical parameters are identified during domain expert review of layer
files, they must be added to both this document and to `GuardrailBounds` before being
used in any layer file.

---

## Serializer mapping notes

Each serializer translates internal parameter keys to the target slicer's key names. The
mapping is one-way: internal → slicer-specific. No slicer-specific key name ever appears
in a layer file or in the resolver.

Not every internal parameter maps to a single slicer key. Examples:

- `bedSizeX` + `bedSizeY` → PrusaSlicer `bed_shape` (a polygon), Bambu `printable_area`
  (a list of four corner coordinates)
- `firmwareFlavor` → PrusaSlicer `gcode_flavor`, not emitted in Bambu/Orca profiles
- `fanKickInLayer` → PrusaSlicer `disable_fan_first_layers`, Bambu
  `close_fan_the_first_x_layers`

These mappings are documented within each serializer file, not here.

Serializers may also emit parameters that have no corresponding internal key — for
example, PrusaSlicer requires `complete_objects`, `avoid_crossing_perimeters`, and
`notes` fields that are invariant across all MVP combinations. These are hardcoded
constants in the serializer and are not part of the internal namespace.
