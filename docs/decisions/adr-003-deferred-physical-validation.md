# ADR-003 — Deferred Physical Validation

**Date:** 19 June 2026  
**Status:** Accepted  
**Context:** M5 engineering complete; launch printers unavailable  
**Relates to:** S-5.4, S-5.5, S-5.6, PV-1, PV-2

---

## Context

PrintHub MVP ships with 20 launch profile combinations.

The original milestone plan required physical validation of all combinations before launch (Stories S-5.4 and S-5.5).

At the time of engineering completion, access to the five launch printers is not available:

* Bambu A1 Mini
* Bambu X1C
* Prusa MK4
* Creality Ender 3 V3 SE
* Creality K1

As a result, physical validation cannot be completed without introducing fabricated results.

---

## Decision

The project distinguishes between:

### Engineering Validation

Performed automatically through:

* profile generation
* guardrail validation
* serializer validation
* build validation
* unit tests
* integration tests
* E2E tests

### Physical Validation

Performed on real hardware using documented procedures and recorded results.

Physical validation is deferred until hardware access becomes available.

---

## Consequences

**Positive:**

* M5 engineering may be considered complete without blocking on hardware access.
* Engineering validation provides a reproducible baseline; physical validation can be applied incrementally when printers are available.

**Launch readiness:**

Launch readiness remains conditional on physical validation. Profiles are not launch-ready until real-world testing has been performed.

All launch combinations may be marked:

* `THEORETICALLY_VALID` — passed engineering validation only
* `PHYSICALLY_VALIDATED` — passed a documented physical test print on target hardware

At the time of this ADR, all 20 launch combinations are `THEORETICALLY_VALID` only.

**Milestone impact:**

| Story | Status |
|---|---|
| S-5.1–S-5.3 (CI and E2E) | Complete as part of M5 engineering |
| S-5.4, S-5.5 (physical validation) | Deferred — tracked as PV-1, PV-2 |
| S-5.6 (pre-launch checklist) | Blocked on physical validation completion |

S-5.4 and S-5.5 remain in `epic-mvp.md` as the authoritative acceptance criteria for physical validation. They are not removed — they are deferred, not cancelled.

---

## Future Work

Physical validation remains tracked under follow-up stories PV-1 and PV-2 (see `epic-mvp.md`).

When hardware access is available:

1. Execute physical validation per [combination-validation-runbook.md](../delivery/combination-validation-runbook.md)
2. Record outcomes in the runbook
3. Revise layer files and re-test any failing combination before setting `isAvailable: true`
4. Complete S-5.6 pre-launch checklist sign-off
