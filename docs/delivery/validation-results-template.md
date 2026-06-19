# Validation Results — {SLUG}

Copy this template for each physical validation attempt. See [combination-validation-runbook.md](./combination-validation-runbook.md) for PASS/FAIL criteria and inspection procedures.

**File name convention:** `{slug}-validation-{YYYY-MM-DD}.md`

---

## Combination identity

| Field | Value |
|---|---|
| **Slug** | |
| **Printer** | |
| **Material** | |
| **Nozzle** | |
| **Goal** | Balanced |
| **PV track** | PV-1 / PV-2 |
| **Slicer format** | PrusaSlicer / Bambu Studio / Orca Slicer |
| **Profile file** | `generated/profiles/...` |

---

## Print metadata

| Field | Value |
|---|---|
| **Validation date** | |
| **Operator name** | |
| **Build commit SHA** | |
| **Printer serial number** | |
| **Printer firmware version** | |
| **Nozzle type and measured diameter** | |
| **Filament brand** | |
| **Filament material and colour** | |
| **Filament spool lot (if available)** | |
| **Filament dried before print** | Yes / No / N/A |
| **Test model** | 20mm calibration cube / 3DBenchy |
| **Print duration** | |
| **Print completed without abort** | Yes / No |
| **Slicer import without errors** | Yes / No |
| **Ambient conditions (optional)** | Temperature / humidity |

---

## Attempt status

| Field | Value |
|---|---|
| **Attempt number** | 1 / 2 / 3 … |
| **Supersedes** | (link to prior attempt, if re-test) |
| **Superseded by** | (filled in if this record is later replaced) |

---

## First-layer inspection

Inspect per [runbook first-layer checks](./combination-validation-runbook.md#first-layer-checks).

| Check | Result (PASS / FAIL) | Notes |
|---|---|---|
| Adhesion | | |
| Line continuity | | |
| Squish | | |
| Consistency | | |

**First-layer category:** PASS / FAIL

**First-layer photo:** (path or filename)

---

## Dimensional inspection

Nominal: 20.00mm. Tolerance: ±0.20mm (0.4mm nozzle) or ±0.25mm (0.6mm nozzle).

| Axis | Measurement (mm) | Tolerance range (mm) | Result (PASS / FAIL) |
|---|---|---|---|
| X | | | |
| Y | | | |
| Z | | | |

| Check | Result (PASS / FAIL) | Notes |
|---|---|---|
| Squareness (no visible skew / layer shift) | | |

**Dimensional category:** PASS / FAIL

**Measurement photos:** (paths or filenames — one per axis minimum)

---

## Stringing inspection

Inspect per [runbook stringing checks](./combination-validation-runbook.md#stringing-checks).

| Check | Result (PASS / FAIL) | Notes |
|---|---|---|
| Fine wisps | | |
| Strings (≥ 0.3mm thick, ≥ 3mm span) | | |
| Oozing blobs (> 1mm) | | |
| PETG-specific (if applicable) | | |

**Stringing category:** PASS / FAIL

**Defect photo (if borderline or FAIL):** (path or filename)

---

## Under-extrusion inspection

Inspect per [runbook under-extrusion checks](./combination-validation-runbook.md#under-extrusion-checks).

| Check | Result (PASS / FAIL) | Notes |
|---|---|---|
| Wall integrity (no layer separation) | | |
| Top surface (closed, no visible infill) | | |
| Perimeter gaps (> 0.3mm, ≥ 3 layers) | | |
| Thin walls (no crush / delamination) | | |

**Under-extrusion category:** PASS / FAIL

**Defect photo (if borderline or FAIL):** (path or filename)

---

## Required photos checklist

| # | Subject | Captured (Yes / No) | Path or filename |
|---|---|---|---|
| 1 | Setup (printer, spool, profile) | | |
| 2 | First layer close-up | | |
| 3 | Completed cube — top | | |
| 4 | Completed cube — side | | |
| 5 | Dimensional — X measurement | | |
| 6 | Dimensional — Y measurement | | |
| 7 | Dimensional — Z measurement | | |
| 8 | Defect close-up (if applicable) | | |

**Photo archive location:** 

---

## Overall outcome

| Field | Value |
|---|---|
| **Overall result** | PASS / FAIL / SUPERSEDED |
| **Failure categories (if FAIL)** | First layer / Dimensional / Stringing / Under-extrusion / Print abort / Import error |
| **Summary notes** | |

### If FAIL — remediation plan

| Field | Value |
|---|---|
| **Likely layer file(s) to revise** | |
| **Parameter changes made** | |
| **Re-test scheduled** | Yes / No |
| **Re-test results record** | (link when available) |

---

## Operator sign-off

I confirm this print was executed and inspected according to the combination validation runbook. The measurements and observations above are accurate.

| Field | Value |
|---|---|
| **Operator name** | |
| **Date** | |
| **Signature** | |

---

## Reviewer sign-off

I confirm I am not the operator for this print. I have reviewed the results, photos, and measurements against the runbook criteria.

| Field | Value |
|---|---|
| **Reviewer name** | |
| **Date** | |
| **Decision** | APPROVED / REJECTED |
| **Review notes** | |
| **Signature** | |

---

## Quick reference — all 20 launch slugs

Use this list to confirm slug spelling when filing results.

```
bambu-a1-mini-pla-04mm-balanced
bambu-a1-mini-pla-06mm-balanced
bambu-a1-mini-petg-04mm-balanced
bambu-a1-mini-petg-06mm-balanced
bambu-x1c-pla-04mm-balanced
bambu-x1c-pla-06mm-balanced
bambu-x1c-petg-04mm-balanced
bambu-x1c-petg-06mm-balanced
prusa-mk4-pla-04mm-balanced
prusa-mk4-pla-06mm-balanced
prusa-mk4-petg-04mm-balanced
prusa-mk4-petg-06mm-balanced
creality-ender-3-v3-se-pla-04mm-balanced
creality-ender-3-v3-se-pla-06mm-balanced
creality-ender-3-v3-se-petg-04mm-balanced
creality-ender-3-v3-se-petg-06mm-balanced
creality-k1-pla-04mm-balanced
creality-k1-pla-06mm-balanced
creality-k1-petg-04mm-balanced
creality-k1-petg-06mm-balanced
```
