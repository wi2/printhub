# ADR-007 — Validation Status Model

**Date:** 2026-06-21  
**Status:** PROPOSED  
**Relates to:** ADR-003, ADR-004, future-data-model.md, roadmap-v2-v5.md

> **PROPOSED** means this ADR documents a known future decision that must be made before the relevant feature work begins. It is not approved. The context, options, and questions below are provided to structure the future decision-making session — not to pre-empt it.

---

## Context

ADR-003 introduced two validation states for combinations:

- `THEORETICALLY_VALID` — passed automated engineering validation (guardrails, build pipeline, unit tests)
- `PHYSICALLY_VALIDATED` — passed a documented physical test print on target hardware

This binary model is sufficient for V1. It becomes too coarse as the product evolves.

V3 introduces community-reported success rates. A combination with 200 successful prints is meaningfully different from a combination with zero — but both may be `PHYSICALLY_VALIDATED` by one engineer's single test print. Conversely, a combination with only one physical test print may deserve less trust than the `PHYSICALLY_VALIDATED` label implies.

V5 introduces AI-generated `ProfileVersion` candidates. These require a staging status before they go live — they have been approved by a curator but not yet physically tested.

The question this ADR must answer: **what is the right set of validation status tiers, and what criteria must be met to advance between them?**

---

## Existing Status (ADR-003)

| Status | Criteria |
|---|---|
| `THEORETICALLY_VALID` | Passes guardrail validation, build pipeline, unit tests, integration tests |
| `PHYSICALLY_VALIDATED` | Passes documented physical test print on target hardware |

---

## Proposed Additional Tiers (Under Consideration)

The following tiers are presented for discussion, not as decided values.

| Proposed Status | Criteria | Notes |
|---|---|---|
| `THEORETICALLY_VALID` | Unchanged from ADR-003 | Starting state for all profiles |
| `COMMUNITY_VALIDATED` | ≥ N successful community feedback submissions (N to be agreed) | Does not require a physical test; reflects real-world usage at scale |
| `CURATOR_APPROVED` | Explicit curator sign-off on an AI-generated candidate | Intermediate state for V5 AI candidates — approved but not yet physically tested |
| `PHYSICALLY_VALIDATED` | Unchanged from ADR-003 — documented physical test print | Required before serving AI-generated profiles; optional upgrade for community-validated profiles |

### Alternative: Keep the binary model, add metadata

Rather than adding status tiers, the binary `THEORETICALLY_VALID` / `PHYSICALLY_VALIDATED` model is kept and augmented with:
- `communitySubmissionCount` — raw number of feedback submissions
- `successRate` — computed from V3 stats
- `physicalTestCount` — number of distinct `ValidationRecord` records

These metadata fields allow the UI to present nuanced trust signals without requiring a formal status promotion workflow.

---

## Questions to Resolve Before Approving

1. Does community feedback constitute a meaningful validation signal that deserves a distinct status tier, or should it remain metadata?
2. What is the minimum number of successful community reports to advance from `THEORETICALLY_VALID` to `COMMUNITY_VALIDATED`? (Requires V3 data analysis to answer meaningfully)
3. Should AI-generated candidates that have passed curator approval but not physical validation be shown to users at all, and if so, what label do they carry?
4. Does the manifests schema (`combinations.json`) need to surface the validation status, or is it an internal backend field only?
5. What happens to a combination's status if its success rate subsequently drops below the threshold? (Demotion path)

---

## Dependency on ADR-003

This ADR extends, not supersedes, ADR-003. The physical validation requirement from ADR-003 is preserved in all options above. Any tier that does not include a physical test print does not replace `PHYSICALLY_VALIDATED` — it is a distinct, lower-trust tier.

---

## Related Documents

| Document | Purpose |
|---|---|
| [ADR-003](./adr-003-deferred-physical-validation.md) | Original two-tier validation model; physical validation requirements |
| [ADR-004](./adr-004-json-as-canonical-profile-format.md) | `validationStatus` field on `ProfileVersion` entity |
| [future-data-model.md](../delivery/future-data-model.md) | `ProfileVersion.validationStatus` and `ValidationRecord` entity |
| [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md) | V3 and V5 context for extended validation requirements |
| [ADR-006](./adr-006-feedback-learning-model.md) (PROPOSED) | V5 AI recommendation model — requires `CURATOR_APPROVED` or equivalent status |
| [combination-validation-runbook.md](../delivery/combination-validation-runbook.md) | Current physical validation procedure |
