# Future Roadmap — Slicer Profile Generator

## Roadmap Philosophy

> Ship fast. Learn from real prints. Build what users actually need next.

This roadmap is organized into four phases. Each phase is gated by evidence — we proceed only when the previous phase has validated its core hypotheses. Dates are indicative; they will shift based on what we learn.

---

## Phase 0 — Foundation (Weeks 1–8)

**Theme:** Build and ship the MVP  
**Status:** In progress

### Goals
- Launch core profile generation flow
- Cover top 20 printers × 6 materials × 4 print goals
- Instrument feedback collection from day one
- Generate first 500 profiles in the wild

### Deliverables

| Item | Description |
|---|---|
| Profile generation form | Printer / Material / Print Goal inputs |
| Parameter engine v1 | Rule-based engine with curated baseline profiles |
| Profile export | PrusaSlicer `.ini`, Bambu/Orca `.json`, Cura `.curaprofile` |
| Plain-English summary | 5-8 bullet explanation of key decisions |
| Feedback prompt | Post-download "Did your print succeed?" |
| Analytics instrumentation | Funnel tracking, generation events, feedback events |
| Public launch | Product Hunt, 3D printing communities, Reddit |

### Exit Criteria
- ≥ 500 profile generations
- ≥ 75% reported first-print success rate
- No critical import failures in production

---

## Phase 1 — Depth & Trust (Months 2–4)

**Theme:** Earn trust by improving profile quality and extending material coverage

### Hypotheses to Validate
- Users will return more if profiles are clearly improving based on feedback
- Extended material support unlocks a significant latent demand pool
- An account system unlocks personalization and retention without excessive friction

### Features

#### Profile Quality Loop
- **Automated failure triage:** When a combination exceeds 30% failure rate, flag it for manual review and profile revision
- **Changelog / version history per combination:** Users see "Profile updated based on 47 print reports" — builds trust
- **Profile confidence indicator:** Show users how many successful prints back a given combination

#### Material Expansion
- SILK PLA
- PLA-CF (carbon fiber)
- PETG-CF
- PA (Nylon, generic)
- PC (Polycarbonate)
- HIPS

#### Slicer Depth
- Bambu Studio profile bundles with filament-specific overrides
- Support for multi-material / AMS configurations (Bambu P1S, X1C)

#### Accounts (Optional, Light)
- Save generation history without re-entering inputs
- Name and tag saved profiles
- No paywall — accounts are free, used to enable personalization

### Exit Criteria
- 30-day return generation rate ≥ 30%
- Coverage index for top 100 combinations ≥ 70%
- First-print success rate maintained ≥ 78%

---

## Phase 2 — Personalization & Community (Months 5–8)

**Theme:** Make the tool feel like it knows your setup and connect users to each other

### Hypotheses to Validate
- Users will share profiles publicly if there is reputation/credit for doing so
- Fine-tuning overlays reduce the gap between generated profiles and "perfect" profiles for expert users
- A community profile layer creates a data flywheel that improves overall quality

### Features

#### Printer Profile Memory
- "My Printers" — save hardware details (nozzle size, bed surface, firmware version)
- Auto-populated form based on last used printer
- Per-printer calibration overrides (e.g. flow rate, Z-offset adjustments saved per machine)

#### Fine-Tuning Overlay
- After profile generation, an optional "Advanced" panel exposes 10–15 key parameters
- Changes are explained in plain English before being applied
- Generates a modified profile that merges user adjustments with the base profile
- Targeted at Persona 2 (Carlos) and Persona 3 (Sarah)

#### Community Profiles
- Users can publish a profile (anonymized or attributed) for a specific combination
- Upvoting / success rate displayed on published profiles
- Moderator-reviewed before entering the "Verified Community" tier
- Rewards: contributor badge, early access to new features

#### Printer Expansion
- Add 30 additional printers based on demand signals from Phase 0–1
- Community-submitted printer definitions (with review)

### Exit Criteria
- ≥ 500 community profiles published
- Personalization features used by ≥ 30% of returning users
- First-print success rate ≥ 82%

---

## Phase 3 — Platform & Monetization (Months 9–14)

**Theme:** Unlock business value for power users and teams while sustaining the free core

### Hypotheses to Validate
- Print farm operators (Persona 4) will pay for multi-machine, team-oriented features
- An API unlocks integrations with existing print management tools (OrcaSlicer plugins, Obico, Printwatch)
- A freemium model sustains the business without degrading the free experience

### Features

#### Team / Fleet Tier (Paid)
- Shared profile library across team members
- Role-based access (admin, contributor, viewer)
- Profile versioning with rollback
- Bulk generation: generate profiles for all printers in the fleet from a single form
- Audit log of who generated what and when

#### API Access (Paid Add-on)
- REST API for profile generation: `POST /generate` with printer, material, goal → returns profile file
- Webhooks for profile quality updates
- Enables integrations with slicer plugins, print farm software, and custom tooling

#### Freemium Tier Structure

| Feature | Free | Pro ($9/mo) | Team ($49/mo/team) |
|---|---|---|---|
| Profile generations | 10/month | Unlimited | Unlimited |
| Saved profiles | 5 | Unlimited | Unlimited + shared |
| Fine-tuning overlay | — | ✓ | ✓ |
| Profile history | — | 90 days | Full history |
| API access | — | — | ✓ |
| Team members | — | — | Up to 10 |
| Priority support | — | Email | Dedicated |

#### Integration Ecosystem
- OrcaSlicer plugin: generate profiles without leaving the slicer
- Bambu Cloud profile sync (if API available)
- Export to Printwatch / Obico for failure detection pairing

### Exit Criteria
- MRR ≥ $5,000
- ≥ 50 paying team accounts
- API used by ≥ 3 third-party integrations

---

## Phase 4 — Intelligence Layer (Months 15–24)

**Theme:** Evolve from rule-based profile generation to a continuously learning model

### Vision
With enough feedback data (target: 50,000 rated print sessions), we can train a model that predicts parameter quality beyond curated rules — including for combinations we have never explicitly profiled.

### Exploratory Features

#### Adaptive Profile Engine
- ML model trained on printer × material × goal × outcome data
- Incorporates print failure reports to reduce failure modes over time
- Handles novel combinations (new printer models, uncommon materials) via interpolation

#### Print Failure Diagnosis
- User uploads a photo of a failed print
- System identifies likely failure mode (stringing, warping, layer separation, under-extrusion)
- Suggests specific parameter adjustments to the generated profile
- Closes the loop: diagnosis → revised profile → re-print

#### Calibration Wizard Integration
- Guide users through a structured calibration sequence (flow rate, pressure advance, max volumetric speed)
- Calibration results are fed back into their personal printer profile
- Generated profiles become progressively more accurate for that specific machine

#### Resin Printer Support
- Separate input model for MSLA/DLP printers (Elegoo Saturn, Phrozen, Anycubic Photon)
- Exposure time, lift speed, layer thickness for resin-specific profiles
- Supports Chitubox and Lychee Slicer export formats

---

## Roadmap Timeline Summary

```
Month:   1-2          3-4          5-8          9-14         15-24
         ────────────────────────────────────────────────────────────
         Phase 0      Phase 1      Phase 2      Phase 3      Phase 4
         Foundation   Depth &      Personal-    Platform &   Intelligence
         & MVP        Trust        ization      Monetization Layer
                      ────────────────────────────────────────────────
         Launch       Quality      Community    API + Teams  ML Engine
         Core flow    loop         profiles     Monetize     Resin
         Top 20       Materials    Fine-tuning  Integrations Diagnosis
         printers     expanded     Printer      Fleet mgmt   Calibration
         Feedback     Accounts     memory                    wizard
         collection   (optional)
```

---

## Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Slicer format changes break exports | Medium | High | Pin to stable slicer versions; CI validation per deploy |
| Profile quality too low to build trust | Medium | Critical | Curate Phase 0 combinations manually before launch; set conservative coverage |
| User feedback response rate too low | High | High | A/B test prompt timing; try email follow-up (with consent) |
| Community profiles introduce bad/unsafe settings | Medium | High | Moderator review gate before "Verified" status |
| Competitor (Bambu, Prusa) releases similar feature natively | Medium | High | Focus on cross-ecosystem, slicer-agnostic value they cannot offer |
| ML model (Phase 4) requires more data than expected | Medium | Medium | Rule-based engine remains production-grade fallback indefinitely |

---

## Open Questions for Future Discovery

1. Is there a viable B2B motion targeting filament manufacturers (they want their material to "just work")?
2. Should we offer a white-label API to printer manufacturers for their own profile generators?
3. What is the right threshold of validated prints before a community profile gets "Verified" status?
4. Is there demand for an offline / local version for users with air-gapped lab environments?
5. Can we partner with a test lab to run physical print validation at scale?
