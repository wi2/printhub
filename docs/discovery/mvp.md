# MVP Definition — Slicer Profile Generator

## MVP Goal

Validate that users can generate a print-ready slicer profile in under 2 minutes, that the profile produces a successful first print for the majority of common printer + material + goal combinations, and that users find the output trustworthy enough to use without further manual tuning.

---

## Scope Decision Framework

For each potential feature, we ask:

1. **Is it on the critical path** to the core value proposition (generate → import → print successfully)?
2. **Does cutting it invalidate the test** we are trying to run?
3. **Can it wait** until we have evidence it is needed?

---

## What Is In MVP

### Core Input Form

| Input | Details |
|---|---|
| Printer selection | Dropdown: curated list of top 20 popular printers at launch |
| Material type | Dropdown: PLA, PETG, ABS, ASA, TPU, PLA+ |
| Material brand (optional) | Free text or known brands list |
| Print goal | Single select: Speed / Balanced / Quality / Strength |

**Rationale:** The narrower the input space, the higher the confidence in the output. We validate on common combinations before expanding.

### Profile Generation Engine

- Rule-based parameter engine seeded with curated community knowledge and manufacturer recommendations
- AI-assisted layer for parameter interpolation on less common combinations
- Output covers all parameters required for a complete, importable profile (not just overrides)

### Supported Slicers at Launch

| Slicer | Format | Notes |
|---|---|---|
| PrusaSlicer | `.ini` | Most common, well-documented format |
| Bambu Studio / Orca Slicer | `.json` profile bundle | Covers Bambu hardware ecosystem |
| Cura | `.curaprofile` | Large installed base |

**One slicer per printer** — the form auto-selects the recommended slicer for the chosen printer. Users can override.

### Profile Output

- Downloadable file in the correct slicer format, ready to import without modification
- Plain-English summary card: 5–8 bullet points explaining the key parameter decisions (e.g. "Print speed is conservative because TPU requires slow movement to avoid stringing")
- Displayed in-browser before download — no account required

### Feedback Mechanism (Lightweight)

After download, a single prompt:

> "Did your print succeed?" → Yes / No / I haven't printed yet

- Stored anonymously against the input combination
- Powers the quality improvement loop from day one
- No account required to submit feedback

---

## What Is Explicitly Out of MVP

| Feature | Reason Deferred |
|---|---|
| User accounts / saved profiles | Adds auth complexity; not required to test core value |
| Multi-printer fleet management | Persona 4 feature; validate P1/P2 first |
| Profile versioning / history | Requires persistence layer; deferred to post-MVP |
| Custom parameter overrides / fine-tuning UI | Adds scope; power users can tune the exported file manually |
| G-code preview | High build cost, low impact on first-print success |
| Community profile sharing | Requires moderation; deferred to roadmap Phase 2 |
| Mobile-native app | Web-first; validate demand before building native |
| Paid tiers / billing | Revenue validation comes after product-market fit signal |
| Resin printer support | Separate parameter space; adds significant complexity |

---

## Printer Coverage at Launch

Priority based on market share and community availability of reference profiles:

| # | Printer | Ecosystem |
|---|---|---|
| 1 | Bambu Lab A1 Mini | Bambu |
| 2 | Bambu Lab P1S | Bambu |
| 3 | Bambu Lab X1C | Bambu |
| 4 | Prusa MK4 | Prusa |
| 5 | Prusa MK3S+ | Prusa |
| 6 | Prusa Mini+ | Prusa |
| 7 | Creality Ender 3 V3 SE | Creality |
| 8 | Creality Ender 3 V3 KE | Creality |
| 9 | Creality K1 | Creality |
| 10 | Creality K1 Max | Creality |
| 11 | AnkerMake M5C | AnkerMake |
| 12 | Flashforge Adventurer 5M | Flashforge |
| 13 | Elegoo Neptune 4 Pro | Elegoo |
| 14 | Qidi X-Max 3 | Qidi |
| 15 | Sovol SV08 | Sovol |
| 16 | Voron 2.4 (stock) | Community |
| 17 | Voron Trident (stock) | Community |
| 18 | Bambu Lab A1 | Bambu |
| 19 | Prusa XL | Prusa |
| 20 | Creality Ender 5 S1 | Creality |

---

## Material Coverage at Launch

| Material | Goal Variants Supported |
|---|---|
| PLA | Speed, Balanced, Quality, Strength |
| PLA+ | Speed, Balanced, Quality, Strength |
| PETG | Balanced, Quality, Strength |
| ABS | Balanced, Strength |
| ASA | Balanced, Strength |
| TPU (95A) | Balanced, Quality |

---

## MVP Success Criteria

The MVP is considered validated when, within the first 60 days:

| Metric | Target |
|---|---|
| Total profile generations | ≥ 500 |
| "Print succeeded" feedback rate | ≥ 75% of responded sessions |
| Generation completion rate (form → download) | ≥ 70% |
| Return visits (same user, new generation) | ≥ 20% of users |
| Qualitative user feedback indicating trust in output | Positive theme in ≥ 60% of open feedback |

---

## Technical Constraints

- Web-first: works in Chrome, Firefox, Safari on desktop
- No account required for core flow
- Profile generation response time: < 3 seconds
- Generated profiles must pass slicer import validation without errors
- No PII collected without explicit user consent

---

## Definition of Done (for each printer/material combination)

A combination is considered "done" when:

- [ ] All required parameters for target slicer(s) are populated (no empty required fields)
- [ ] Profile imports without errors into the target slicer
- [ ] A test print using a standard benchmark model (e.g., Benchy, calibration cube) completes without failure
- [ ] The plain-English summary accurately reflects the generated parameters
- [ ] Feedback collection is active for that combination
