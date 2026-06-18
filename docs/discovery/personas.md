# User Personas — Slicer Profile Generator

## Overview

Four primary personas drive product decisions. They are ordered from highest acquisition priority (P1) to strategic long-term value (P4).

---

## Persona 1 — "The Enthusiastic Beginner"

**Name:** Maya, 27  
**Occupation:** Graphic designer, prints as a hobby  
**Printer:** Bambu Lab A1 Mini (6 months owned)  
**Priority:** P1 — Highest volume acquisition target

### Background
Maya bought her first printer after seeing satisfying prints on social media. She is comfortable with design tools (Figma, Illustrator) but finds slicer software intimidating. She has had 3 failed prints in the last month and is close to giving up on certain materials.

### Goals
- Print successfully without reading documentation
- Understand what went wrong when a print fails
- Try new materials (PETG, silk PLA) without fear

### Frustrations
- Slicer presets don't work for her specific printer + filament brand combination
- Reddit answers are contradictory and buried in jargon
- She doesn't know which parameter caused a failure

### Jobs to Be Done
> "When I want to print with a new filament, I want a profile I can trust so I don't waste material learning the hard way."

### How Slicer Profile Generator Helps
- Single-form input → instant, importable profile
- Plain-English summary explains the key settings
- No slicer expertise required

### Success Indicators
- Completes a profile generation in < 2 minutes on first visit
- Returns to generate profiles for new materials
- Self-reports a successful first print

---

## Persona 2 — "The Time-Strapped Maker"

**Name:** Carlos, 35  
**Occupation:** Industrial designer at a product consultancy  
**Printer:** Prusa MK4, Bambu X1C  
**Priority:** P1 — High value, high frequency user

### Background
Carlos prints functional prototypes regularly — enclosures, jigs, brackets, presentation models. He knows slicer settings well but finds it tedious to re-tune every time he switches materials or has a new quality target. He manages profiles in spreadsheets and often copies settings from old jobs.

### Goals
- Generate a solid starting profile in seconds, not hours
- Tune from a good baseline rather than starting from scratch
- Maintain consistency across two different printers

### Frustrations
- Spends 30-60 minutes tuning when switching to a new material
- Profiles drift over time as he tweaks without documenting
- Has to redo work when a colleague uses a different settings baseline

### Jobs to Be Done
> "When I start a new print job with an unfamiliar material, I want a reliable starting point so I can focus on the design, not the slicer."

### How Slicer Profile Generator Helps
- Reduces baseline tuning time from 30-60 min to < 5 min
- Generates consistent, repeatable profiles
- Supports multiple printers under a single account (future)

### Success Indicators
- Uses the tool for every new material/printer combination
- Exports and re-imports saved profiles across sessions
- Refers colleagues or teammates to the tool

---

## Persona 3 — "The Quality Chaser"

**Name:** Sarah, 42  
**Occupation:** Miniature painter and commission printer  
**Printer:** Bambu X1C, resin (Elegoo Saturn)  
**Priority:** P2 — Lower volume, high advocacy value

### Background
Sarah prints detailed miniatures for tabletop gaming, both for personal use and paid commissions. Surface quality is everything. She has accumulated deep slicer knowledge over years but still spends significant time dialing in profiles for new resins or fine-tuning for a specific model geometry.

### Goals
- Achieve best-in-class surface quality for detailed prints
- Push tolerance parameters to their limit safely
- Understand trade-offs between quality and print time

### Frustrations
- Quality-focused presets are rare and often outdated
- Community profiles optimized for quality are hidden in forums
- Small parameter changes have unpredictable cascading effects

### Jobs to Be Done
> "When I'm printing a commission piece, I want to start from a maximum-quality profile that I know has been validated, not a general-purpose one I have to degrade manually."

### How Slicer Profile Generator Helps
- Print Goal = "Surface Quality" generates fine-tuned, conservative profiles
- Explainability layer shows which parameters drive quality vs. speed trade-offs
- Gives her a validated baseline even for unfamiliar materials

### Success Indicators
- Generates quality-optimized profiles for each new filament spool
- Provides detailed feedback that improves the model
- Shares generated profiles with her community

---

## Persona 4 — "The Print Farm Operator"

**Name:** Dmitri, 38  
**Occupation:** Runs a small-batch on-demand printing business (8 printers)  
**Printer:** Mixed fleet (Bambu X1C × 4, Prusa MK4 × 4)  
**Priority:** P3 — Lower acquisition priority but high LTV and word-of-mouth

### Background
Dmitri runs a small business printing custom parts for local companies. Consistency and uptime are critical — a bad profile on 8 machines means 8 failed jobs. He employs one part-time assistant who is not a slicer expert. Profile management is a recurring operational headache.

### Goals
- Standardize profiles across all machines and operators
- Quickly onboard new filament suppliers without service disruption
- Reduce print failure rate to protect profit margins

### Frustrations
- Profiles tuned on one machine don't always work on another
- His assistant can't troubleshoot slicer problems independently
- No centralized way to store, version, or share profiles across the team

### Jobs to Be Done
> "When I onboard a new filament brand, I want a production-ready profile generated for all my printers so my assistant can start printing without my involvement."

### How Slicer Profile Generator Helps
- Generates profiles for multiple printer models simultaneously (future)
- Provides a repeatable, documented baseline for each material
- Reduces dependency on any single operator's institutional knowledge

### Success Indicators
- Generates profiles for all printer models in the fleet
- Uses the tool to onboard new materials without operator intervention
- Upgrades to a team/business tier (future paid plan)

---

## Persona Comparison Matrix

| Dimension | Maya (Beginner) | Carlos (Maker) | Sarah (Quality) | Dmitri (Farm) |
|---|---|---|---|---|
| Slicer expertise | Low | High | Very high | Medium |
| Print frequency | Weekly | Daily | Daily | Continuous |
| Primary goal | Success | Speed | Quality | Consistency |
| Export format needed | Bambu Studio | PrusaSlicer / Bambu | PrusaSlicer / Bambu | All |
| Willingness to pay | Low (free tier) | Medium | Medium | High |
| Feedback quality | Low detail | High detail | Very high detail | Operational |
| Acquisition channel | Social / YouTube | Community forums | Niche communities | Direct / B2B |
