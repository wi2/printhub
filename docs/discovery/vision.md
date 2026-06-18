# Product Vision — Slicer Profile Generator

## Vision Statement

> **Empower every 3D printing enthusiast and professional to achieve great print results on the first try — without needing to be a slicer expert.**

---

## Problem

3D printing still demands deep technical knowledge to produce consistently good results. Users must navigate dozens of slicer parameters — layer height, print speed, temperature, supports, retraction — and the right combination varies by:

- **Printer model** (motion system, extruder type, bed type)
- **Material** (PLA, PETG, ASA, TPU, resin, etc.)
- **Print goal** (speed, strength, surface quality, flexibility)

Today's reality:

| Pain Point | Impact |
|---|---|
| Default slicer profiles are generic and often wrong | Wasted filament, failed prints |
| Community profiles are scattered and unvetted | No single source of truth |
| Tuning is a manual, iterative, time-consuming process | Friction kills creative momentum |
| Beginners are overwhelmed; experts waste time on known problems | Low retention across the entire user spectrum |

---

## Our Bet

The combination of **structured printer/material/goal inputs** + **a curated, AI-assisted parameter engine** can generate production-ready profiles that work reliably out of the box — removing the trial-and-error cycle for the vast majority of print scenarios.

---

## Product Vision

**Slicer Profile Generator** is the intelligent bridge between "I have a printer and a material" and "I have a print that looks right."

It takes three simple inputs:

1. **Printer** — make, model, and hardware configuration
2. **Material** — type, brand, and any known material properties
3. **Print Goal** — what matters most (speed, quality, strength, dimensional accuracy, etc.)

And returns:

- A **ready-to-import slicer profile** (.3mf / .ini / .config) for the target slicer (PrusaSlicer, Bambu Studio, Orca Slicer, Cura)
- A **plain-English summary** explaining the key decisions made and why
- **Optional fine-tuning suggestions** to push results further

---

## Strategic Pillars

### 1. Accuracy Over Coverage
A profile that works reliably for 80% of common combinations is more valuable than a system that covers every edge case poorly. We start narrow and deepen.

### 2. Transparent Reasoning
Users should understand *why* a parameter was chosen. Explainability builds trust and teaches — turning the tool into a learning platform over time.

### 3. Ecosystem Integration
Profiles must be importable directly into the most popular slicers without manual reformatting. The last mile matters.

### 4. Community as a Data Flywheel
User feedback on profile quality (did this print succeed?) becomes signal to improve future generations. Better data → better profiles → more users → more data.

### 5. Meet Users Where They Are
The product should be accessible to a first-time printer owner and still be useful to a print farm operator tuning for throughput.

---

## What We Are Not Building (Now)

- A slicer itself — we generate inputs *for* slicers, not replace them
- A G-code generator
- A printer monitoring or remote control platform
- A marketplace for buying profiles

These remain out of scope for the current product horizon but are not ruled out long-term.

---

## Target Users (Summary)

| Segment | Core Job To Be Done |
|---|---|
| Hobbyist beginners | Print reliably without learning slicer internals |
| Intermediate makers | Stop wasting time re-tuning for every new filament spool |
| Professional / prosumer | Maintain consistent quality across materials and jobs |
| Print farm operators | Standardize profiles across machines and operators |

Full personas are documented in [`personas.md`](./personas.md).

---

## Success in 12 Months

- Users can generate a working profile in under 2 minutes
- 80%+ of generated profiles result in a successful first print (per user self-report)
- Profiles support the top 4 slicers and top 20 printer models at launch
- A feedback loop is live and actively improving profile quality

Full success metrics are documented in [`success-metrics.md`](./success-metrics.md).
