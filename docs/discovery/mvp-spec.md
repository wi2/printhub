# MVP Specification — Slicer Profile Generator

**Version:** 1.0  
**Status:** Approved for design and build  
**Scope:** Based on discovery documents + review findings (June 2026)  
**Review source:** [`docs/decisions/discovery-review.md`](../decisions/discovery-review.md)

---

## What This Document Is

This is the single source of truth for what the MVP does, how users move through it, what they input, what they receive, and how success is defined. It does not discuss architecture, technology, or implementation choices.

---

## Product Purpose (One Sentence)

A user tells us their printer, material, nozzle size, and print goal — we give them a ready-to-import slicer profile and show them exactly how to use it.

---

## Scope Decisions

The following decisions are made explicitly based on the discovery review. They are not negotiable for v1.

| Decision | Rationale |
|---|---|
| 5 printers at launch, not 20 | Each combination requires a physical test print to ship with integrity |
| 3 materials at launch, not 6 | Reduces combination matrix to a testable size |
| 2 print goals at launch, not 4 | Speed and Strength require testing infrastructure we don't have yet |
| Nozzle size is a required input | A 0.4mm profile on a 0.6mm nozzle will underextrude — this is not optional |
| 2 slicer formats at launch | PrusaSlicer + Bambu/Orca — the two dominant ecosystems; Cura deferred |
| No Voron printers | No such thing as a "stock" Voron; hardware variance makes generic profiles unreliable |
| Post-download import guide is in-scope | The user journey does not end at file download |
| No AI-assisted interpolation | Rule-based engine only in v1; interpolation adds cost and unpredictability |
| Feedback loop designed for 5% response rate | 30% is unrealistic; loop must work with much lower signal |

---

## Supported Combinations at Launch

### Printers

| # | Printer | Default Slicer |
|---|---|---|
| 1 | Bambu Lab A1 Mini | Bambu Studio / Orca Slicer |
| 2 | Bambu Lab X1C | Bambu Studio / Orca Slicer |
| 3 | Prusa MK4 | PrusaSlicer |
| 4 | Creality Ender 3 V3 SE | PrusaSlicer |
| 5 | Creality K1 | Bambu Studio / Orca Slicer |

### Materials

| # | Material |
|---|---|
| 1 | PLA |
| 2 | PETG |
| 3 | TPU (95A) |

### Nozzle Sizes

| Size | Notes |
|---|---|
| 0.4mm | Default for all printers at launch |
| 0.6mm | Available for all printers |

### Print Goals

| Goal | What it means |
|---|---|
| Balanced | Good quality with reasonable print time. The safe default for most users. |
| Quality | Best surface finish, slower print time. For display models, miniatures, presentation parts. |

### Total Validated Combinations

5 printers × 3 materials × 2 nozzle sizes × 2 goals = **60 combinations**

Each combination must pass a physical print test before it is shown as available to users. Combinations that have not been tested are not shown. Users do not see "coming soon" states — untested combinations simply do not appear in the form yet.

---

## User Journey

The complete MVP user journey is five stages. The product is responsible for stages 1 through 5 — the journey does not end at file download.

```
[1. Land]  →  [2. Configure]  →  [3. Generate]  →  [4. Import]  →  [5. Feedback]
```

---

### Stage 1 — Land

**User arrives at the product homepage.**

**What the user sees:**
- A single headline that states the product's value proposition
- A brief explanation in plain language (2–3 sentences maximum)
- One call to action: "Generate my profile"
- No registration prompt, no login wall, no pricing table

**What the user does:**
- Reads the headline
- Clicks "Generate my profile"

**Exit:** User arrives at the configuration screen.

**Failure mode:** User bounces without clicking. This is the primary drop-off risk at this stage.

---

### Stage 2 — Configure

**User builds their profile by filling in four inputs.**

This is the only data collection step. It is a single screen with four inputs. The form does not advance step-by-step — all four inputs are visible simultaneously.

#### Input 1: Printer

- **Type:** Searchable dropdown
- **Label:** "What printer are you using?"
- **Options:** The 5 supported printers listed by full name (brand + model)
- **Behavior:** Selecting a printer automatically pre-selects the correct slicer for the output. The user can override the slicer selection.
- **Required:** Yes

#### Input 2: Material

- **Type:** Segmented selector (large tap targets)
- **Label:** "What material are you printing with?"
- **Options:** PLA · PETG · TPU
- **Behavior:** If a material is not yet validated for the selected printer, it is shown greyed out with the label "Not yet available for this printer." The user cannot select it.
- **Required:** Yes

#### Input 3: Nozzle Size

- **Type:** Segmented selector
- **Label:** "What is your nozzle size?"
- **Options:** 0.4mm · 0.6mm
- **Helper text:** "Not sure? Most printers ship with a 0.4mm nozzle."
- **Required:** Yes

#### Input 4: Print Goal

- **Type:** Two-option card selector with descriptions
- **Label:** "What matters most for this print?"
- **Options:**
  - **Balanced** — "Good quality and reasonable print time. Good for most prints."
  - **Quality** — "Best surface finish. Slower print time. Good for display pieces."
- **Required:** Yes

#### Slicer Override (secondary, below the form)

- **Label:** "Output format"
- **Type:** Small dropdown, pre-filled based on printer selection
- **Options:** Bambu Studio / Orca Slicer · PrusaSlicer
- **Behavior:** Automatically correct for the selected printer. Visible but not prominent — only relevant to users who know what they are doing.

#### Generate Button

- **Label:** "Generate profile"
- **State — disabled:** When any required input is missing. The button is greyed and non-interactive.
- **State — enabled:** When all four inputs are filled. The button becomes active.
- **State — loading:** On click, the button label changes to "Generating…" and a progress indicator appears. The form inputs are locked.

**Exit:** Generation completes → user is taken to the Result screen.

**Failure mode:** User does not complete all four inputs. Drop-off tracked per input field.

---

### Stage 3 — Result

**User sees their generated profile and a summary of what it contains.**

This is the most important screen in the product. It must accomplish two things simultaneously: deliver the file and give the user enough understanding to trust it.

#### Profile Summary Card

Displayed above the download button. Contains:

- **Profile title:** "[Printer] · [Material] · [Nozzle] · [Goal]" — e.g. "Bambu A1 Mini · PLA · 0.4mm · Balanced"
- **Three plain-English highlights:** The three most important parameter decisions for this combination, written for a non-expert. Each highlight is one sentence.

  > "Print speed is set to 180mm/s — fast enough for efficiency, conservative enough to keep quality consistent."

  > "Layer height is 0.2mm — the standard for balanced prints. Drop to 0.12mm manually if you need finer detail."

  > "Bed temperature is 55°C. If you see corners lifting, try 60°C."

- **Confidence indicator:** A simple count, e.g. "Validated on 12 successful prints." This number increments as feedback is collected. For untested edge cases that made it through (should not happen at launch, but as a safeguard) this reads "New profile — be the first to report results."

#### Download Button

- **Label:** "Download profile"
- **Behavior:** Triggers immediate file download. The file is named predictably: `[printer-slug]-[material]-[nozzle]-[goal].[ext]`
  - Example: `bambu-a1-mini-pla-04mm-balanced.3mf`
- **Position:** Prominent, primary action.

#### What Happens After Click

The Download button does not disappear after clicking. The screen transitions to show:

1. A "Download started" confirmation
2. The Import Guide (Stage 4) immediately below — it slides into view, it is not a separate page

This keeps the user on the same URL. If they navigate back after printing, they return to the result with the same profile.

#### Secondary Action: Copy Link

A small "Share this profile" link copies the current URL to the clipboard. The URL is stable and can be bookmarked or shared. Anyone who visits the URL sees the same result screen and can download the same file.

---

### Stage 4 — Import Guide

**User is shown step-by-step instructions for importing the file into their slicer.**

This screen appears immediately after download is triggered, on the same page below the result card. It is not optional and not hidden behind a toggle. The user does not have to ask for it.

The guide is specific to the slicer detected from the user's printer selection. It shows the steps for that slicer only.

#### Bambu Studio / Orca Slicer Guide

> **How to import your profile into Bambu Studio**
>
> 1. Open Bambu Studio
> 2. Click **File → Import → Import Configs…**
> 3. Select the file you just downloaded
> 4. Click **OK** when prompted to confirm the import
> 5. In the top bar, open the **Filament** dropdown and select the imported filament profile
> 6. Open the **Process** dropdown and select the imported process profile
> 7. Slice your model as normal

#### PrusaSlicer Guide

> **How to import your profile into PrusaSlicer**
>
> 1. Open PrusaSlicer
> 2. Click **File → Import → Import Config Bundle…**
> 3. Select the file you just downloaded
> 4. The profile will appear in your Print Settings, Filament Settings, and Printer dropdowns
> 5. Select all three before slicing

Each guide includes one inline tip relevant to the specific slicer/printer combination. For example, for Bambu:

> **Tip:** The imported profile is not the same as the built-in Bambu filament profiles. Do not mix them. Use the imported profile for this material/goal only.

#### After the Import Guide

Below the import guide, the Feedback prompt (Stage 5) appears.

---

### Stage 5 — Feedback

**User is asked a single question about print success.**

The feedback prompt appears at the bottom of the Result screen, below the import guide. It is always visible — it does not require a second visit or a separate email.

#### Prompt

> "Did your print succeed with this profile?"

#### Response options

Three options displayed as buttons:

| Option | Label |
|---|---|
| A | Yes — it worked |
| B | No — it failed |
| C | I haven't printed yet |

#### On Response: Yes

- A short thank-you confirmation: "Thanks. This helps us improve the profile for everyone."
- No further action required.

#### On Response: No

- The user is shown a single follow-up question:
  > "What went wrong?" with five preset options (tap to select, multi-select allowed):
  - Warping / lifting corners
  - Stringing or oozing
  - Layer separation
  - Under-extrusion (gaps, thin lines)
  - Other / I'm not sure
- After selecting, a brief confirmation: "Thanks for the report. We'll review this combination."
- No further action required.

#### On Response: Haven't printed yet

- A short message: "No problem. Come back after your print and let us know how it went."
- A "Remind me" option appears (optional): the user can enter an email address to receive a single follow-up in 48 hours. This is **opt-in only** and clearly framed as a print reminder, not a marketing email.
- If the user returns and visits the same profile URL, the feedback prompt is shown again (not pre-filled).

#### Feedback Visibility

The feedback count feeds the confidence indicator on the Result card. "Validated on N successful prints" increments in near-real-time as successful feedback is submitted. Users who submit a "Yes" response see the number increase, giving a sense of contribution to the community.

---

## Screens Summary

| Screen | Purpose | Primary Action | Can be reached by |
|---|---|---|---|
| **Home** | Land and orient the user | "Generate my profile" | Direct URL, any link |
| **Configure** | Collect the 4 inputs | "Generate profile" | Home CTA, direct URL |
| **Result** | Show profile + summary + download | "Download profile" | Configure (on generation) or direct URL |
| **Import Guide** | Show import steps | (No CTA — instructional) | Appears on Result after download |
| **Feedback** | Collect print outcome | Yes / No / Not yet | Appears on Result below import guide |

**Total screens: 3 distinct views** (Home, Configure, Result — with Import Guide and Feedback embedded in Result)

---

## Profile Output Specification

### What a generated profile contains

The profile file is a complete, standalone slicer config — not a delta or a set of overrides. A user importing it does not need to have any existing profile to merge it with.

#### PrusaSlicer output (`.ini` config bundle)

Contains three merged sections:
- **[print]** — layer height, speeds, cooling, supports, infill
- **[filament]** — temperatures, retraction, flow rate
- **[printer]** — bed size, nozzle diameter, firmware flavor

Importable via File → Import → Import Config Bundle.

#### Bambu Studio / Orca Slicer output (`.3mf` project template)

Contains:
- **Process profile** — layer height, speeds, quality settings
- **Filament profile** — temperatures, flow, cooling
- **Printer profile** — machine configuration

Importable via File → Import → Import Configs.

### What a profile does NOT contain

- G-code (profiles are slicer inputs, not machine outputs)
- Model geometry (the user slices their own model with the profile applied)
- Calibration overrides (flow rate calibration, Z-offset — these remain user-managed)

### Parameter coverage

Every generated profile sets a value — or an explicit slicer default — for all required parameters. No required parameter is left empty. The user should be able to import and slice without encountering a "missing parameter" warning in the slicer.

---

## Inputs Specification (Complete)

| Input | Type | Required | Values | Notes |
|---|---|---|---|---|
| Printer | Searchable dropdown | Yes | 5 options | Drives default slicer format |
| Material | Segmented selector | Yes | PLA · PETG · TPU | Greyed if not validated for selected printer |
| Nozzle size | Segmented selector | Yes | 0.4mm · 0.6mm | Helper text for uncertain users |
| Print goal | Card selector | Yes | Balanced · Quality | Plain-English descriptions on each card |
| Slicer format | Small dropdown | No (auto-set) | PrusaSlicer · Bambu/Orca | Pre-filled; user can override |

---

## Edge Cases and Boundary Behaviors

| Scenario | Behavior |
|---|---|
| User selects a printer and a material that has no validated profile | Material option is greyed out and non-selectable for that printer |
| User selects a nozzle size with no validated profile for the combination | A message appears: "We haven't validated a [nozzle size] profile for this combination yet. We'll add it soon." Generate button remains disabled. |
| User arrives at a Result URL for a combination that has since been removed | A message is shown: "This profile is no longer available. Generate a new one." Link to Configure screen. |
| User downloads and then reloads the page | They return to the same Result screen. Download button is still active. Profile can be downloaded again. |
| User submits "No" feedback on a profile that already has > 30% failure rate | No visible change to the user. Internally, the combination is flagged for review. The confidence indicator freezes and stops showing new counts until the profile is revised and re-validated. |
| User tries to access Configure with all 4 fields pre-filled via URL parameters | This is supported. A URL like `?printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced` pre-fills the form. The user can review and submit immediately. |

---

## Out of Scope for MVP

These features are explicitly not in scope. They are documented here to prevent scope creep during build.

| Feature | Reason |
|---|---|
| User accounts | Not required to test core value; adds significant build time |
| Saved profile history | Requires persistence layer; deferred |
| Fine-tuning / parameter editor | Power user feature; beginners should not see it |
| Community profile sharing | Requires moderation; deferred to Phase 2 |
| G-code preview | High cost, low impact on first-print success |
| Print failure diagnosis (photo upload) | Phase 4 feature |
| Resin printer support | Entirely separate parameter space |
| Mobile app | Web-first; validate before building native |
| Paid tiers / billing | Deferred until after product-market fit |
| AMS / multi-material configuration | Material profile complexity; deferred to Phase 1 |
| Email notifications (beyond the opt-in print reminder) | Not required for MVP |
| Voron printers | No standardized hardware configuration |
| Cura export format | Deferred; PrusaSlicer and Bambu/Orca cover the majority of active users |
| Speed and Strength print goals | Require mechanical testing infrastructure not yet available |

---

## Success Criteria

The MVP is validated — and the team has enough signal to invest in Phase 1 — when all of the following are met within **60 days of public launch**.

### Must-pass (all required)

| # | Criterion | Target | How measured |
|---|---|---|---|
| M1 | Total profile generations | ≥ 500 | Product analytics |
| M2 | Form completion rate (start → download) | ≥ 65% | Funnel analytics |
| M3 | First-print success rate (of sessions with any feedback) | ≥ 72% | Feedback responses |
| M4 | Profile import success rate (synthetic test) | 100% | Automated CI validation |
| M5 | Generation response time (P50) | < 3 seconds | Server-side timing |
| M6 | Return profile generation (same user, within 30 days) | ≥ 15% of users | Analytics (cookie-based) |

### Should-pass (2 of 3 required)

| # | Criterion | Target | How measured |
|---|---|---|---|
| S1 | Feedback response rate | ≥ 5% of download sessions | Feedback events |
| S2 | Qualitative trust signal | "I would use this again" in ≥ 60% of open responses | Post-download optional comment |
| S3 | Any unsolicited external mention (Reddit, Discord, YouTube, forum) | ≥ 1 per week by week 6 | Manual monitoring |

### Failure conditions (any one triggers a product halt and reassessment)

| # | Condition | Threshold |
|---|---|---|
| F1 | First-print success rate below threshold | < 50% of feedback responses report success |
| F2 | Profile import breaks after a slicer update | Any unresolved import error in production for > 48 hours |
| F3 | Any profile generates parameters outside safety bounds | Temperature > material max spec, or speed > printer max spec — zero tolerance |

---

## Definition of "Ready to Launch"

Before the first user sees the product, all of the following must be true:

- [ ] All 60 combinations have a generated profile file
- [ ] Each of the 60 profile files has been physically test-printed on the target printer (Benchy or calibration cube)
- [ ] Each profile imports without errors into its target slicer (automated test passing)
- [ ] The import guide has been manually tested by a person unfamiliar with the slicer (not the person who wrote the guide)
- [ ] The feedback prompt displays and submits correctly for all three response options
- [ ] The "No" failure flow captures and stores failure reason correctly
- [ ] Profile URLs are stable and bookmarkable
- [ ] URL pre-fill parameters work correctly for all 4 inputs
- [ ] Zero required parameters are missing from any generated profile
- [ ] Safety parameter guardrails are active (temperature and speed bounds enforced per material spec)
