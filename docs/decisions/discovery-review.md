# Discovery Review — Brutal Honest Assessment

**Reviewer perspective:** Startup founder + principal engineer  
**Date:** June 2026  
**Documents reviewed:** vision.md, personas.md, mvp.md, success-metrics.md, roadmap.md

---

## Summary Verdict

The documents are well-structured and internally consistent. They read like good consulting work. That is also the problem — they are too clean. They avoid the hard questions, bury the most dangerous assumptions in polished prose, and confuse "covering a lot of surface area" with "having a strategy." Several sections would need to be torn down and rewritten before committing engineering resources.

---

## 1. Unvalidated Assumptions

These are stated or implied as facts. None of them have been tested.

### A1. "A rule-based engine will produce profiles that work reliably out of the box"

This is the core product bet and it is almost certainly wrong at the level of precision we are claiming.

The 3D printing parameter space has enormous real-world variance that a generic rule engine cannot capture:

- Same printer model, different hardware batch (bed flatness, extruder tension)
- Same filament brand, different spool (moisture, color additive changes flow characteristics)
- Ambient temperature and humidity affecting first layer adhesion
- Worn nozzle vs fresh nozzle (especially relevant for abrasives)
- User-installed mods (different bed springs, hotend swap, direct drive conversion)

A profile generated for "Bambu X1C + Prusament PETG + Quality" will produce different results on my X1C vs yours. The 80% success rate target sounds reasonable in a doc but is extremely ambitious in the real world. We need to test this before writing it into the strategy as a given.

**What to do:** Before writing another line of product spec, generate 20 profiles manually and have 5 real users test them. Report the actual success rate. It will calibrate every other assumption in these documents.

---

### A2. "Users will submit feedback at 30% response rate"

The success-metrics.md says:

> Feedback response rate target: ≥ 30%

This is not a target — it is a fantasy. Industry baseline for post-download feedback prompts on free tools is **3–8%**. If your entire quality improvement loop depends on a 30% response rate and you actually get 5%, the data flywheel never spins. You will have 500 generations and 25 feedback responses, which tells you almost nothing.

**What to do:** Redesign the feedback loop for a 5% response rate. That means either the feedback mechanism is in-product and unavoidable (not a post-download prompt), or you rely on a different signal (email follow-up after 48 hours, or a return visit as a proxy for success). Set the target at ≥ 8% and treat 15% as exceptional.

---

### A3. "We need 20 printers and 3 slicer formats at MVP"

The mvp.md lists:

- 20 printers at launch
- 6 materials × 4 goals = up to 480 combinations
- 3 slicer output formats

The Definition of Done requires each combination to pass a physical Benchy test. **That is up to 480 physical test prints.** At 1–2 hours each, it is over a month of continuous printing on a single machine, before you write a single line of application code.

Nobody is going to do this. What will actually happen is: combinations get marked "done" without physical testing, a bad profile ships, a user gets a failed print on the first day, they post on Reddit, and trust is destroyed before it is built.

This is not scope management — it is fantasy planning dressed up as a launch checklist.

**What to do:** Launch with 3 printers, 3 materials, 2 goals. 18 combinations. Test every single one physically. Launch when those 18 are genuinely reliable. Expand from a position of proven quality, not assumed quality.

---

### A4. "Beginners will know how to import a profile file"

The user journey in every document ends at "downloadable file." It never addresses what happens next.

Maya (the beginner persona) downloads a `.ini` file. Now what? She needs to:

1. Know where the import function is in her slicer
2. Understand the difference between a printer profile, filament profile, and print settings profile in PrusaSlicer (they are three separate things)
3. Know to select the right profile before slicing
4. Understand that the profile does not automatically apply to open projects

This is where beginners actually fail. The product stops at the hardest step.

**What to do:** The post-download experience is part of the product. At minimum, show a 3-step animated import guide specific to the user's slicer immediately after download. At best, build a browser extension or slicer plugin that imports directly (see Missing Opportunities section).

---

### A5. "Bambu is just another printer in the dropdown"

The competitive analysis in the roadmap lists "competitor releases similar feature natively" as a medium-likelihood risk. This underestimates the situation.

**Bambu Lab already does this.** Their slicer (Bambu Studio / Orca Slicer) already ships hundreds of tested material profiles for Bambu printers, selectable by filament brand. For a Bambu user with a Bambu filament spool, the problem we are claiming to solve is already largely solved by Bambu.

The three Bambu printers in the MVP list (A1 Mini, P1S, X1C) account for a large portion of the consumer market. If the product does not clearly beat the native Bambu experience for Bambu users, we are building for Prusa and Creality users only — a narrower market than the documents assume.

**What to do:** Explicitly define what we do better than the native Bambu Studio profile selection. If the answer is "cross-brand filament profiles" or "third-party filament brands not in Bambu's database," that is a defensible niche. But say it explicitly — do not pretend the native experience does not exist.

---

### A6. "The personas are based on real users"

No part of the personas document says these are based on interviews, surveys, or observed behavior. Carlos, Maya, Sarah, and Dmitri are composites invented in a product planning session. They are coherent and plausible, but they are hypotheses, not facts.

The risk: if even one major assumption is wrong (e.g., beginners do not actually want to understand the "why" behind parameters — they just want to click and print), features built on that persona become waste.

**What to do:** Add an explicit "Validation Status" field to each persona:

> **Validation status:** Unvalidated hypothesis — 0 user interviews conducted as of June 2026.

Then schedule 5 interviews with real Maya-type users before committing to the explainability roadmap pillar.

---

## 2. Real Risks Not in the Documents

### R1. Slicer format instability is HIGH risk, not MEDIUM

The roadmap rates "slicer format changes break exports" as medium likelihood. In practice:

- Bambu Studio and Orca Slicer are in active, fast development. Their JSON profile schema has already changed multiple times. Orca Slicer is a community fork that diverges from Bambu Studio on its own schedule.
- PrusaSlicer's `.ini` format differs between 2.x and 3.x in non-trivial ways.
- Cura undergoes major restructuring between major versions (4.x to 5.x broke almost all third-party profiles).

This means the engineering team will spend a recurring, non-trivial percentage of time just keeping exports valid — not improving the product. This is a maintenance tax that has no ceiling.

**What to do:** Reduce slicer format coverage at MVP. Support one format excellently. Accept that supporting all four slicers means owning all four format migration stories forever. Alternatively, invest early in an abstraction layer that maps parameters to output formats — but acknowledge this is a significant upfront engineering investment.

---

### R2. The feedback signal is biased by survivorship

First-print success rate is measured by self-report from users who choose to respond. Users who had a successful print are significantly more likely to:

- Return to the product (where the feedback prompt lives)
- Feel positive and complete a survey

Users who had a failed print are more likely to:

- Close the tab and not come back
- Not see the feedback prompt at all

The metric will always look better than reality. A reported 80% success rate might reflect a true success rate of 55%. This is not a minor data quality issue — it directly affects the core product decision of "is the engine good enough to build on?"

**What to do:** Acknowledge this bias in the metrics document. Consider proactive feedback collection via email (with consent) at a fixed 48-hour interval after download, which reaches both successful and failed users. Track email click-through rate separately from feedback rate.

---

### R3. No safety or liability strategy

A bad profile could damage a printer or in extreme cases start a fire. Setting the hotend temperature 30°C too high for a material is a real failure mode with real consequences. The documents contain zero mention of:

- Disclaimer language for generated profiles
- Maximum/minimum parameter guardrails in the engine
- What happens when a community-submitted profile in Phase 2 has dangerous settings
- Legal exposure if a fire is traced to a generated profile

This is not a paranoid edge case — it is a foreseeable outcome of generating machine control files for hardware that operates at 200–300°C. It needs to be addressed before launch, not in Phase 3.

---

### R4. Monetization is 9–14 months away with no bridge

The roadmap defers all monetization to Phase 3. There is no mention of:

- Current funding/runway
- Cost of infrastructure (LLM API calls if AI is used, hosting, CDN)
- Cost of physical profile testing and validation
- Break-even model

A free product with no revenue for 12+ months requires either investment capital or a very low cost structure. Neither is mentioned. If the plan is bootstrapped, the Phase 3 monetization timeline needs to compress dramatically.

**What to do:** Add a funding/cost assumption section to the roadmap. If bootstrapped, consider moving the Pro tier to Phase 1 with a "supporter" framing — early users who pay a small amount to fund development and get saved profiles in return. Gauging willingness to pay early is more valuable than delaying it.

---

### R5. Voron printers in MVP is a trap

The MVP printer list includes Voron 2.4 and Voron Trident "stock." There is no such thing as a stock Voron. Voron printers are community-built from a spec with enormous variance in:

- Sourced components (cheap vs quality linear rails, different hotend brands)
- Wiring and firmware configuration
- Assembly quality

A "Voron 2.4 profile" that works on one machine will fail on another. Including Vorons in MVP adds complexity and guarantees some user complaints that cannot be resolved by improving the profile — they are hardware variance problems. Remove them.

---

## 3. Over-Engineering

### OE1. AI-assisted interpolation in MVP

The mvp.md includes:

> AI-assisted layer for parameter interpolation on less common combinations

This is doing too much in the MVP. An LLM interpolating slicer parameters adds:

- API cost per generation (not modeled anywhere)
- Latency risk (LLM calls are not reliably sub-3 seconds)
- Unpredictability (LLM outputs need validation before they go into a machine control file)
- A dependency on an external service with its own pricing and availability

For MVP, the engine should be **pure rules only.** Ship LLM interpolation in Phase 1 when you have a baseline to compare against and a test harness to catch bad outputs.

---

### OE2. Plain-English summary for beginners is over-specified too early

Explaining *why* every parameter was chosen is a Phase 1 or 2 feature. Maya does not need to understand pressure advance theory on her first visit. She needs the print to work.

The explainability feature is genuinely valuable — but it belongs to Carlos and Sarah, not Maya. Building it into the MVP adds content generation complexity for the combination that needs it least.

**What to do:** For MVP, the summary is three lines: "Here's your profile. It's optimized for [goal]. Key setting: [1 thing]. Import guide for [slicer]: [link]." Deep explanations come later when you know which users actually read them.

---

### OE3. Four print goals at MVP is too many to test well

Speed / Balanced / Quality / Strength across 20 printers and 6 materials means tuning 480 combinations. Balanced and Quality are hard to distinguish without side-by-side test prints. Strength requires mechanical testing (tensile tests), not visual inspection.

**What to do:** Launch with **two goals only:** Balanced and Quality. Speed and Strength profiles require either sophisticated testing infrastructure or you will ship profiles that feel arbitrary. Reduce the input space and increase the depth.

---

## 4. Missing Opportunities

### MO1. The real job-to-be-done is "help me get a good print" — not "give me a file"

Every document frames the product as a file generator. But the actual job users want done is: "I want my print to succeed."

There are two places where users fail between our product and a successful print:

1. **Import** — they do not know how to load the profile into their slicer
2. **First layer** — even a good profile fails if bed leveling or Z-offset is wrong

A product that generates a profile AND walks users through the import step AND explains how to verify the first layer has completed its job. A product that stops at the file download has completed half the job.

---

### MO2. Filament manufacturer partnerships are the best growth channel — and it is buried in "open questions"

The roadmap's open questions ask: "Is there a viable B2B motion targeting filament manufacturers?"

This is not an open question — it is the best distribution strategy in the documents and it should be Phase 1.

Filament brands (Polymaker, eSUN, Bambu, Hatchbox, Prusament) have a direct incentive: if their filament works out of the box on any printer, they get fewer support tickets, more positive reviews, and more repeat purchases. They will co-market, link to the tool from their packaging QR codes, and potentially pay for branded profile pages.

This is a B2B2C motion that acquires users at zero marginal cost to us.

**What to do:** Contact 3 filament brands before launching the MVP. Ask if they want their filament to have a validated profile page. The answer will almost certainly be yes. This becomes the first distribution channel and the first revenue conversation.

---

### MO3. SEO is the highest-ROI acquisition channel and it is never mentioned

Users literally Google "how to print PETG on Bambu X1C" before every new material. A static page per combination — with the profile download, the summary, and import instructions — is a high-intent SEO acquisition machine.

"PrusaSlicer profile for Ender 3 V3 + ASA" is a keyword with virtually no competition and high commercial intent.

This is not in the vision, not in the roadmap, and not in the go-to-market. It is probably the single highest-ROI investment available to this product in months 1–6.

---

### MO4. The nozzle size is missing from the input form

The MVP input form is: Printer + Material + Print Goal.

This is incomplete. A 0.4mm brass nozzle and a 0.6mm hardened steel nozzle on the same printer require completely different profiles:

- Different layer height ranges
- Different print speeds (volumetric throughput limit changes)
- Different pressure advance values
- Hardened steel nozzle runs hotter and may need temperature compensation

A profile generated for a 0.4mm nozzle imported into a printer with a 0.6mm nozzle will underextrude significantly. For Persona 2 (Carlos) who upgrades nozzles regularly, this is a first-class use case the current form cannot serve.

**Minimum fix:** Add "Nozzle size" as a 4th input. It is a dropdown (0.2 / 0.4 / 0.6 / 0.8 / 1.0mm). Every professional user will expect it.

---

### MO5. The browser extension is the real product

The hardest step in the user journey is the import. An OrcaSlicer / Bambu Studio / PrusaSlicer browser companion that injects a "Generate Profile" button into the slicer — generating and directly applying the profile without leaving the application — would be 10x better UX than a file download.

This is technically feasible for OrcaSlicer (open-source, has a plugin API). It is harder for Bambu Studio but possible via CLI. This should be in Phase 1 or 2, not Phase 4.

---

## 5. Recommended Rewrites

### vision.md
- Add a section "What We Know vs. What We're Assuming"
- Replace "Bambu Studio, Orca Slicer, Cura" in the output spec with a prioritized single-slicer focus
- Add a "Why we will win" competitive analysis section that directly addresses Bambu's native profile system

### personas.md
- Add `Validation Status: [Unvalidated / Partially validated / Validated]` to each persona
- Add a 5th persona: **the filament brand product manager** (B2B persona for partnership motion)
- Remove Voron from Maya's printer options — beginners do not self-build Vorons

### mvp.md
- Reduce printers from 20 to 3–5 (Bambu A1 Mini, Prusa MK4, Ender 3 V3 SE — cover Bambu/Prusa/Creality ecosystems)
- Reduce materials from 6 to 3 (PLA, PETG, TPU — the three most common pain points)
- Reduce print goals from 4 to 2 (Balanced, Quality)
- Remove AI-assisted interpolation entirely
- Add nozzle size as 4th input
- Add post-download import guide as an in-scope MVP deliverable
- Add safety guardrails (temperature limits, speed limits) as a non-negotiable constraint

### success-metrics.md
- Reduce feedback response rate target from 30% to 8%
- Add a survivorship bias disclaimer to the first-print success rate metric
- Add a revenue/monetization leading indicator (e.g., "% of users who click a hypothetical 'Save profile' CTA")
- Replace "Summary Comprehension Score (quarterly user testing)" with "Summary Helpfulness Rating (inline Yes/No on every generation)"

### roadmap.md
- Move filament manufacturer partnership outreach to Phase 0 (before launch)
- Move nozzle size input to MVP
- Move SEO/static combination pages to Phase 1
- Move browser extension / slicer plugin to Phase 2 (not Phase 4)
- Remove Voron printers from all phases until Phase 2 minimum
- Add a funding model / runway assumption section
- Add an explicit "we are not competing with Bambu's native profiles on Bambu hardware" scope decision, or explicitly state how we beat them

---

## Highest-Priority Actions Before Writing Code

1. **Run 5 user interviews** with real beginners (Maya-type). Ask what they actually do when they get a new filament. Do they Google? Ask Reddit? Give up? The answer determines whether this product has a distribution channel.

2. **Generate 10 profiles manually and test them physically.** Report the actual first-print success rate before assuming it will be 75%+.

3. **Call 2 filament brands** (suggest Polymaker and eSUN). Ask if they want their materials profiled. This is a 30-minute call that could define Phase 1 growth.

4. **Clarify the competitive position vs. Bambu's native system** in a one-pager. If we cannot clearly explain why a Bambu user should come to us instead of clicking "Select Filament Profile" in Bambu Studio, the product has a fundamental positioning problem.

5. **Decide: rule-based only, or LLM-assisted from day one?** These are not equivalent bets technically or economically. Make the call explicitly, document the trade-offs, then build accordingly.
