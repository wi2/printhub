# Combination Validation Runbook

Operational procedure for physical validation of all 20 launch profile combinations. Required by [ADR-003](../decisions/adr-003-deferred-physical-validation.md) before any combination may be marked `isAvailable: true` in the manifest.

**Related stories:** PV-1 (Bambu — same scope as S-5.4), PV-2 (Prusa and Creality — same scope as S-5.5). Blocked downstream: S-5.6 pre-launch checklist.

---

## Purpose

Engineering validation (build, guardrails, serializers, automated tests) confirms that generated profiles are structurally correct. Physical validation confirms that a profile produces an acceptable print on the target printer with representative filament.

A combination is **launch-ready** only when:

1. It passes this runbook on target hardware.
2. A completed [validation results record](./validation-results-template.md) exists for that combination.
3. The operator and reviewer sign-off sections are complete.
4. The build has been re-run and the manifest reflects the validated set.

At the time of ADR-003 acceptance, all 20 combinations are `THEORETICALLY_VALID` only. No combination should be treated as user-ready until physical validation is complete.

---

## Scope

| Track | Printers | Combinations |
|---|---|---|
| **PV-1** | Bambu Lab A1 Mini, Bambu Lab X1C | 4 + 4 = 8 |
| **PV-2** | Prusa MK4, Creality Ender 3 V3 SE, Creality K1 | 4 + 4 + 4 = 12 |

**Total:** 20 combinations — PLA and PETG, 0.4mm and 0.6mm nozzles, Balanced goal only.

---

## Prerequisites

### Hardware

One physical unit per printer model in scope. Printer must be stock (no aftermarket hotend, extruder, or firmware mods unless documented in the results record).

| Printer ID | Display name | Slicer format | PV track |
|---|---|---|---|
| `bambu-a1-mini` | Bambu Lab A1 Mini | Bambu Studio / Orca Slicer (`.3mf`) | PV-1 |
| `bambu-x1c` | Bambu Lab X1C | Bambu Studio / Orca Slicer (`.3mf`) | PV-1 |
| `prusa-mk4` | Prusa MK4 | PrusaSlicer (`.ini`) | PV-2 |
| `creality-ender-3-v3-se` | Creality Ender 3 V3 SE | PrusaSlicer (`.ini`) | PV-2 |
| `creality-k1` | Creality K1 | Bambu Studio / Orca Slicer (`.3mf`) | PV-2 |

### Nozzles

Brass nozzles at the tested diameter (0.4mm or 0.6mm). Nozzle must match the combination under test. Record actual measured diameter if known.

### Filament

Use a mainstream, dry filament brand for each material:

| Material | Requirement |
|---|---|
| **PLA** | Generic PLA, 1.75mm, stored dry. Record brand, colour, and spool lot if available. |
| **PETG** | Generic PETG, 1.75mm, dried per manufacturer recommendation before printing. Record brand, colour, and spool lot if available. |

Do not use specialty blends (carbon fibre, silk, matte) for validation prints.

### Tools

- Digital calipers (0.01mm resolution)
- Camera or phone for required photos
- Build surface in good condition (clean, appropriate for material)
- Target slicer installed (PrusaSlicer 2.x, Bambu Studio, or Orca Slicer as applicable)

### Profile source

1. Run `npm run build` from a clean checkout on the commit under validation.
2. Import the generated profile from `generated/profiles/` — do not hand-edit parameters before the validation print.
3. Confirm slicer import completes without errors before starting the print.

---

## Test model

Each validation print uses **one** standard benchmark model:

| Model | File | When to use |
|---|---|---|
| **20mm calibration cube** | 20×20×20mm solid cube, single perimeter, 15–20% infill | Default for all combinations. Required for dimensional checks. |
| **3DBenchy** | Standard Benchy STL | Optional second print when stringing or overhang behaviour needs closer inspection after a cube PASS. |

**Rule:** The calibration cube is mandatory for every combination. Benchy is optional and does not replace the cube.

Print orientation: cube flat on the bed, one face fully on the build plate. Benchy upright, standard orientation.

---

## Procedure overview

For each combination:

1. Complete the pre-print checklist (below).
2. Import the profile and slice the calibration cube without parameter changes.
3. Print the cube.
4. Inspect first layer before removing from bed (photo required).
5. Remove print, allow to cool, perform all inspections.
6. Capture required photos.
7. Record results in a copy of [validation-results-template.md](./validation-results-template.md).
8. If **PASS**: proceed to sign-off.
9. If **FAIL**: revise layer files, rebuild, re-print. Do not set `isAvailable: true` until a subsequent run **PASS**es.

---

## Pre-print checklist

Complete before starting each validation print:

- [ ] Correct printer, nozzle size, and material loaded
- [ ] Build surface clean and appropriate for material (PLA / PETG)
- [ ] Filament dry and feeding reliably
- [ ] Bed leveling / mesh / auto-level verified per printer manual
- [ ] Z-offset verified with a first-layer test or prior successful print on this printer
- [ ] Profile imported from `generated/profiles/` without modification
- [ ] Slicer shows no import errors or missing-parameter warnings
- [ ] Correct nozzle diameter set in slicer (matches combination)
- [ ] Results template copied and header fields filled in

---

## PASS / FAIL criteria

### Overall outcome

| Outcome | Definition |
|---|---|
| **PASS** | Print completes without abort. All four inspection categories (first layer, dimensional, stringing, under-extrusion) **PASS**. Slicer import succeeded. |
| **FAIL** | Print aborts or fails to complete, **or** any inspection category **FAIL**s, **or** slicer import fails. |

A combination with any **FAIL** must not be marked `isAvailable: true` until the root cause is addressed, layer files revised, and a re-test **PASS**es.

### First-layer checks

Inspect the bottom face and first-layer perimeter while the print is still on the bed (or immediately after removal, before handling distorts the surface).

| Check | PASS | FAIL |
|---|---|---|
| **Adhesion** | Entire first layer bonded to the bed; no lifted corners or edge curling | Any corner or edge lifted > 0.5mm, or part detached during print |
| **Line continuity** | Extrusion lines touch adjacent lines with no gaps > 0.2mm | Visible gaps between adjacent lines on > 10% of the first-layer area |
| **Squish** | Lines are slightly flattened; no bare bed visible between lines | Severe under-extrusion (bare bed visible) or severe over-extrusion (ridges > 0.3mm above neighbouring lines across > 25% of area) |
| **Consistency** | First-layer appearance uniform across the footprint | Obvious thick/thin bands, pausing artefacts, or skipped sections |

**First-layer category:** PASS only if all four checks PASS.

### Dimensional checks

Measure the calibration cube with digital calipers after the print has cooled to room temperature. Measure each axis at the mid-height of the cube (avoid top/bottom elephant-foot zones).

Nominal dimension: **20.00mm** per axis.

| Nozzle | Tolerance (per axis) |
|---|---|
| 0.4mm | ±0.20mm (acceptable range 19.80–20.20mm) |
| 0.6mm | ±0.25mm (acceptable range 19.75–20.25mm) |

Record X, Y, and Z measurements in the results template.

| Check | PASS | FAIL |
|---|---|---|
| **X axis** | Within tolerance | Outside tolerance |
| **Y axis** | Within tolerance | Outside tolerance |
| **Z axis** | Within tolerance | Outside tolerance |
| **Squareness** | No visible skew; opposing faces parallel within casual inspection | Obvious lean or non-orthogonal faces suggesting layer shift |

**Dimensional category:** PASS only if X, Y, and Z are each within tolerance and squareness check PASSes.

### Stringing checks

Inspect the cube top edges, corners, and any retraction travel paths visible on exterior surfaces. If a Benchy was printed, also inspect the cabin opening, bridge underside, and chimney.

| Check | PASS | FAIL |
|---|---|---|
| **Fine wisps** | Hair-thin wisps (< 0.1mm) on ≤ 2 locations, removable by hand | — |
| **Strings** | No string thicker than 0.3mm bridging a gap | Any string ≥ 0.3mm thick spanning ≥ 3mm between separate features |
| **Oozing blobs** | No material blobs on exterior surfaces > 1mm diameter | Blob > 1mm on a visible exterior face |
| **PETG-specific** | Minor wisps acceptable if adhesion and dimensions PASS | Strings or blobs that would fail the thresholds above |

**Stringing category:** PASS if no stringing check FAILs. Fine wisps alone do not fail.

### Under-extrusion checks

Inspect all visible faces of the cube, paying attention to top surfaces, vertical corners, and layer lines.

| Check | PASS | FAIL |
|---|---|---|
| **Wall integrity** | All four vertical walls solid; no split layers | Visible horizontal gaps between layers (layer separation) on any wall |
| **Top surface** | Top face closed; infill not visible through solid top layers | Holes, gaps, or visible infill pattern on top surface |
| **Perimeter gaps** | No gaps along vertical seams > 0.3mm wide | Gaps > 0.3mm on any vertical seam spanning ≥ 3 consecutive layers |
| **Thin walls** | Walls feel uniformly rigid; no soft or crushed sections | Walls visibly thin, crushed, or delaminating |

**Under-extrusion category:** PASS only if all four checks PASS.

---

## Required photos

Capture all photos in adequate lighting. Include a scale reference (ruler or calipers) where noted.

| # | Subject | When | Required content |
|---|---|---|---|
| 1 | **Setup** | Before print | Printer, material spool label, nozzle size, slicer profile name |
| 2 | **First layer** | On bed, ~layer 3–5 printing or immediately after layer 1 completes | Close-up showing line adhesion and squish |
| 3 | **Completed cube — top** | After cooldown | Full top face |
| 4 | **Completed cube — side** | After cooldown | One vertical face showing layer lines |
| 5 | **Dimensional measurement** | After measurement | Calipers on X, Y, and Z (one photo per axis minimum) |
| 6 | **Defect close-up** | If any check is borderline or FAIL | Closest view of the defect with scale reference |

Store photos in the project validation archive (path decided at execution time). Record the archive location in each results template.

---

## Recording results

For each combination, create one results record:

1. Copy [validation-results-template.md](./validation-results-template.md) to a validation archive directory.
2. Name the file `{slug}-validation-{YYYY-MM-DD}.md` (e.g. `bambu-a1-mini-pla-04mm-balanced-validation-2026-06-19.md`).
3. Fill in every section.
4. Link the record from the combination tracker table below.

Required fields per S-5.4 / S-5.5 acceptance criteria: date, printer serial/build, filament brand, outcome, notes.

---

## Failure handling

When a combination **FAIL**s:

1. Record the failure category and observations in the results template.
2. Identify the likely layer file(s) to revise (`layers/printers/`, `layers/materials/`, `layers/nozzles/`, or `layers/goals/`).
3. Revise parameters. Do not bypass guardrails.
4. Run `npm run build` and confirm zero guardrail violations for the combination.
5. Re-print and re-inspect using this runbook.
6. Create a new results record for each re-test attempt. Mark superseded records as `SUPERSEDED` in the outcome field.
7. Only after a **PASS** may `isAvailable: true` be set for that combination in the build output.

---

## Launch combination tracker

Update the **Outcome** column as validation proceeds. Slugs match `scripts/build.ts` and `generated/combinations.json`.

### PV-1 — Bambu Lab A1 Mini (4)

| Slug | Printer | Material | Nozzle | Results record | Outcome |
|---|---|---|---|---|---|
| `bambu-a1-mini-pla-04mm-balanced` | Bambu Lab A1 Mini | PLA | 0.4mm | | Pending |
| `bambu-a1-mini-pla-06mm-balanced` | Bambu Lab A1 Mini | PLA | 0.6mm | | Pending |
| `bambu-a1-mini-petg-04mm-balanced` | Bambu Lab A1 Mini | PETG | 0.4mm | | Pending |
| `bambu-a1-mini-petg-06mm-balanced` | Bambu Lab A1 Mini | PETG | 0.6mm | | Pending |

### PV-1 — Bambu Lab X1C (4)

| Slug | Printer | Material | Nozzle | Results record | Outcome |
|---|---|---|---|---|---|
| `bambu-x1c-pla-04mm-balanced` | Bambu Lab X1C | PLA | 0.4mm | | Pending |
| `bambu-x1c-pla-06mm-balanced` | Bambu Lab X1C | PLA | 0.6mm | | Pending |
| `bambu-x1c-petg-04mm-balanced` | Bambu Lab X1C | PETG | 0.4mm | | Pending |
| `bambu-x1c-petg-06mm-balanced` | Bambu Lab X1C | PETG | 0.6mm | | Pending |

### PV-2 — Prusa MK4 (4)

| Slug | Printer | Material | Nozzle | Results record | Outcome |
|---|---|---|---|---|---|
| `prusa-mk4-pla-04mm-balanced` | Prusa MK4 | PLA | 0.4mm | | Pending |
| `prusa-mk4-pla-06mm-balanced` | Prusa MK4 | PLA | 0.6mm | | Pending |
| `prusa-mk4-petg-04mm-balanced` | Prusa MK4 | PETG | 0.4mm | | Pending |
| `prusa-mk4-petg-06mm-balanced` | Prusa MK4 | PETG | 0.6mm | | Pending |

### PV-2 — Creality Ender 3 V3 SE (4)

| Slug | Printer | Material | Nozzle | Results record | Outcome |
|---|---|---|---|---|---|
| `creality-ender-3-v3-se-pla-04mm-balanced` | Creality Ender 3 V3 SE | PLA | 0.4mm | | Pending |
| `creality-ender-3-v3-se-pla-06mm-balanced` | Creality Ender 3 V3 SE | PLA | 0.6mm | | Pending |
| `creality-ender-3-v3-se-petg-04mm-balanced` | Creality Ender 3 V3 SE | PETG | 0.4mm | | Pending |
| `creality-ender-3-v3-se-petg-06mm-balanced` | Creality Ender 3 V3 SE | PETG | 0.6mm | | Pending |

### PV-2 — Creality K1 (4)

| Slug | Printer | Material | Nozzle | Results record | Outcome |
|---|---|---|---|---|---|
| `creality-k1-pla-04mm-balanced` | Creality K1 | PLA | 0.4mm | | Pending |
| `creality-k1-pla-06mm-balanced` | Creality K1 | PLA | 0.6mm | | Pending |
| `creality-k1-petg-04mm-balanced` | Creality K1 | PETG | 0.4mm | | Pending |
| `creality-k1-petg-06mm-balanced` | Creality K1 | PETG | 0.6mm | | Pending |

---

## Operator sign-off

The operator is the person who executed the print and completed the inspection.

| Field | Value |
|---|---|
| **Operator name** | |
| **Date** | |
| **PV track** | PV-1 / PV-2 |
| **Combinations tested (this session)** | |
| **Build commit SHA** | |
| **Profile import verified** | Yes / No |
| **All required photos captured** | Yes / No |
| **Overall outcome** | PASS / FAIL (per combination — list below) |

**Combination outcomes (operator attestation):**

| Slug | Outcome | Notes |
|---|---|---|
| | PASS / FAIL | |
| | PASS / FAIL | |

I confirm that each listed combination was printed and inspected according to this runbook. Measurements and photos are accurate to the best of my knowledge.

**Operator signature:** ___________________________ **Date:** ___________

---

## Reviewer sign-off

The reviewer is a different person from the operator (per S-5.6). The reviewer verifies the results record, photos, and measurements — they do not need to have executed the print.

| Field | Value |
|---|---|
| **Reviewer name** | |
| **Date** | |
| **Records reviewed** | (list slugs or link to archive) |
| **Photos reviewed** | Yes / No |
| **Measurements independently verified** | Yes / No / N/A (sample check) |
| **Failure remediation verified (if applicable)** | Yes / No / N/A |

**Review checklist:**

- [ ] Results template complete for every combination claimed PASS
- [ ] First-layer photo present and consistent with PASS criteria
- [ ] Dimensional measurements within tolerance and recorded
- [ ] No unresolved FAIL categories
- [ ] Re-test records exist for any combination that failed on first attempt
- [ ] Build commit SHA matches the profile used for the validation print

**Reviewer decision:** APPROVED / REJECTED (return to operator with notes)

**Reviewer signature:** ___________________________ **Date:** ___________

---

## Completion criteria

Physical validation (PV-1 and PV-2) is complete when:

- [ ] All 20 combinations have a **PASS** results record with operator and reviewer sign-off
- [ ] The tracker table above shows **PASS** for every row
- [ ] Any revised layer files are committed and the final build reports zero guardrail violations
- [ ] `generated/combinations.json` reflects the validated set with `isAvailable: true` only for PASS combinations
- [ ] S-5.6 pre-launch checklist may proceed
