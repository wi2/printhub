# Product Backlog

Items identified during delivery but explicitly deferred. Do not implement from this list without a scoped story.

**Last updated:** Product Polish pass (June 2026)

---

## UX & Onboarding

| ID | Item | Rationale for deferral |
|---|---|---|
| UX-1 | Dedicated About page | Home page now covers product explanation, scope, and validation status. Revisit only if navigation depth increases (e.g. accounts, blog). |
| UX-2 | Interactive onboarding tour on Configure page | Adds complexity; URL pre-fill and clearer copy cover the primary confusion points at MVP. |
| UX-3 | Validation status badge per combination (`THEORETICALLY_VALID` / `PHYSICALLY_VALIDATED`) | Requires manifest schema change and PV-1/PV-2 completion. Static copy on profile page is sufficient until physical validation lands. |
| UX-4 | Live print success count on profile pages | Deferred per epic Cut 2 — stats API post-launch Week 1. |
| UX-5 | Printer-specific before-printing tips | Generic guidance is sufficient at MVP; per-printer tips need domain review and manifest or content model. |

---

## Design System

| ID | Item | Rationale for deferral |
|---|---|---|
| DS-1 | Extract shared `Button` / `Card` React components | CSS classes in `src/styles/global.css` cover current needs with zero product logic. Extract when a third consumer or variant set appears. |
| DS-2 | Dark mode | No user demand signal; adds token surface area without MVP validation value. |
| DS-3 | Custom web font | System font stack matches Linear/Railway minimal aesthetic at zero load cost. |

---

## Content & Trust

| ID | Item | Rationale for deferral |
|---|---|---|
| CT-1 | Per-combination validation runbook link on profile page | Operational detail; link when PV-1/PV-2 complete and public transparency is warranted. |
| CT-2 | Profile changelog / version history | Phase 1 trust feature per roadmap. |
| CT-3 | Expand Home "Coming soon" into a public roadmap page | Marketing surface; not required for core generate-download loop. |

---

## Technical

| ID | Item | Rationale for deferral |
|---|---|---|
| TE-1 | Analytics instrumentation (Plausible / PostHog) | Post-launch Week 1 per epic deferred list. |
| TE-2 | SlicerOverride UI | Cut from MVP; add in Phase 1 if feedback shows demand. |
| TE-3 | Email reminder on "Haven't printed yet" | Cut from MVP per epic scope challenge. |

---

## Related documents

- MVP scope and deferred features: `docs/delivery/epic-mvp.md` (Phase 1 table)
- Physical validation: `docs/decisions/adr-003-deferred-physical-validation.md`
- Phase 1 roadmap: `docs/discovery/roadmap.md`
