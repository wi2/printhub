# ADR-006 — Feedback Learning Model

**Date:** 2026-06-21  
**Status:** PROPOSED  
**Relates to:** ADR-004, roadmap-v2-v5.md §6, future-data-model.md, backlog.md V5 stories

> **PROPOSED** means this ADR documents a known future decision that must be made before V5 implementation begins. It is not approved. The context, options, and questions below are provided to structure the future decision-making session — not to pre-empt it.

---

## Context

PrintHub collects three outcome signals from users after each profile download:

- `success` — the print succeeded on the first attempt
- `failure` — the print failed; user selects one or more preset failure reasons
- `pending` — the user has not yet printed

At V1–V3, this data drives confidence scoring and threshold alerting. At V4, it enables descriptive correlation analysis. At V5, it must be sufficient to train a model that suggests parameter improvements.

The question this ADR must answer: **what constitutes a valid training signal, how is the training data structured, and what safeguards govern how model outputs are applied?**

---

## Questions to Resolve Before Approving

### 1. What is the minimum training data threshold?

The recommendation engine must not activate for a combination until a statistically meaningful number of outcomes have been collected. The threshold must be agreed before V5 implementation begins.

Considerations:
- Too low: spurious correlations are presented as confident suggestions
- Too high: the system never activates for low-volume combinations
- Indicative range: 100–1,000 feedback submissions per combination; exact threshold requires data analysis from V3

### 2. How are failure reasons used as training signal?

The current failure reason list is a preset set (from `server/validate-input.ts`). The learning model needs to map failure reasons to likely causal parameters. Options:

a) **Curated lookup table** (V4 approach): human-authored mapping of failure reason → likely parameters. No learning; explicit and auditable.  
b) **Correlation from data**: compute which parameter ranges correlate with each failure reason. Requires sufficient volume per reason.  
c) **Structured notes** (future): free-text failure descriptions that the model processes. Requires NLP capability. Out of scope until sufficient volume exists.

### 3. What safeguards govern model outputs?

At minimum:
- Guardrail validation applies to all model outputs — out-of-bounds suggestions are rejected before reaching human review
- Human approval is mandatory for all AI-generated `ProfileVersion` candidates (documented in roadmap-v2-v5.md §6)
- Physical validation is mandatory before any AI-assisted profile is marked `PHYSICALLY_VALIDATED`

Are additional safeguards needed? For example:
- Maximum parameter delta per suggestion (e.g. temperature cannot change by more than ±10°C in one suggestion)
- Minimum confidence score threshold on the suggestion before it is surfaced to curators
- Per-parameter change frequency limits (preventing rapid oscillation)

### 4. What model approach is used?

Options range from simple (weighted moving average of success rate per parameter bucket) to complex (gradient boosting, neural network). The right approach depends on:
- Volume of training data available at V5 launch
- Team's ML capability at that time
- Accuracy requirements

This ADR does not pre-select a model approach. It defines the interface: the model receives `ProfileVersion.parameters` × `Feedback.outcome` pairs and produces parameter delta suggestions. The implementation is scoped in V5 engineering.

---

## Non-Goals

The following are explicitly out of scope for this ADR and the V5 learning system:

- PrintHub does not generate entirely new profiles for unseen combinations from scratch (interpolation of unseen combinations is a Phase 4+ concern per `docs/discovery/roadmap.md`)
- PrintHub does not process images of failed prints (photo-based diagnosis is a Phase 4 feature)
- PrintHub does not modify guardrail bounds based on model outputs
- The model does not auto-apply suggestions — human approval is mandatory

---

## Mandatory Safeguards (Pre-agreed)

Regardless of the implementation approach selected when this ADR is approved, the following safeguards are non-negotiable:

1. Guardrail validation rejects all out-of-bounds suggestions before they reach human review
2. Every AI-generated `ProfileVersion` candidate carries `source: 'ai-recommendation'`
3. Human approval (`approvedBy`, `approvedAt`) is required before `isActive` can be set
4. Physical validation (`ValidationRecord` with `printOutcome: 'pass'`) is required before `PHYSICALLY_VALIDATED` status
5. The complete provenance chain (recommendation → approval → validation) is persisted and queryable

---

## Related Documents

| Document | Purpose |
|---|---|
| [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md) | §6 V5 objectives and non-negotiable safeguards |
| [future-data-model.md](../delivery/future-data-model.md) | `Feedback`, `ProfileVersion`, `ValidationRecord` entities |
| [backlog.md](../delivery/backlog.md) | V5 story list |
| [ADR-004](./adr-004-json-as-canonical-profile-format.md) | Establishes canonical JSON as the training input format |
| [ADR-007](./adr-007-validation-status-model.md) (PROPOSED) | Validation status tiers relevant to AI-generated profiles |
