# ADR-001 — Rendering Strategy for MVP

**Date:** 2026-06-19  
**Status:** Accepted  
**Supersedes:** `system-overview.md` §4.1 (rendering strategy table)

---

## Context

`system-overview.md` §4.1 specified SSG + ISR for `/profile/[slug]` pages, with the stated rationale that pre-rendered profile pages are the highest-ROI SEO distribution channel. `profile-persistence.md` makes a detailed case for generated artifacts over persisted entities, including a reference to SSG rendering as part of the build pipeline.

The current implementation uses Vite with React Router — a client-side rendering (CSR) SPA. No SSG framework is installed. Adopting SSG at MVP would require choosing and integrating a framework (Next.js, Astro, or `vite-ssg`) before M3 work can begin.

Two factors shape this decision:

1. **Launch blocker is physical, not technical.** The critical path to launch is 20 physical test prints across 5 printers (S-5.4, S-5.5). Engineering work in M2–M4 is expected to complete before that validation finishes. Adding SSG framework integration is additional engineering work that does not shorten the physical validation schedule.

2. **SEO benefit requires sustained traffic, not launch volume.** Profile pages earn search ranking over weeks and months. The value of SSG is realized at Phase 1 scale — when 60–200+ combinations exist, when the domain has authority, and when organic search becomes a meaningful acquisition channel. At MVP with 20 combinations and no domain history, the SEO delta between CSR and SSG is immaterial.

---

## Decision

MVP uses CSR with Vite. Profile pages at `/profile/[slug]` are rendered client-side via React Router.

SSG for profile pages is deferred to Phase 1.

`system-overview.md` §4.1 rendering strategy table is superseded by this ADR. All other content in `system-overview.md` remains authoritative.

---

## Consequences

**Accepted:**
- Profile page content is not present in the initial HTML response. Search engines that do not execute JavaScript will not index profile highlights or titles.
- First contentful paint on `/profile/[slug]` requires JavaScript execution.
- The deployment model is a pure static SPA (`dist/`) served from a CDN — no SSR server required at MVP.

**Not affected:**
- The profile artifact model (`profile-persistence.md`) remains correct. Profile files and `combinations.json` are still build-time outputs.
- The feedback service architecture is unchanged.
- URL slug stability requirements are unchanged.

---

## Alternatives Considered

| Option | Reason not chosen |
|---|---|
| **Next.js App Router with SSG** | Requires migrating from Vite. Full framework adoption adds ramp-up cost and changes the entire build toolchain. Justified at Phase 1 scale; over-engineered at MVP. |
| **Astro** | Strong fit for content-heavy static sites. Similar migration cost to Next.js. Deferred to Phase 1 for the same reason. |
| **`vite-ssg`** | Community-maintained plugin that adds SSG to Vite without a framework migration. Simpler than Next.js or Astro but no ISR support. Strongest candidate if SSG is required before Phase 1. Deferred to keep M3 scope contained. |
| **CSR (chosen)** | No migration. M3 stories can be built against the existing Vite setup immediately. SEO trade-off is acceptable at MVP launch scale. |

---

## Revisit Trigger

This decision must be revisited before Phase 1 work begins. Specifically, before the combination set expands beyond 20 and before any SEO-driven acquisition is planned. At that point, `vite-ssg` or a framework migration should be evaluated against the traffic and indexing data collected during the MVP period.

If organic search on profile pages is identified as a meaningful acquisition channel in the post-MVP review, this decision is superseded and SSG adoption is prioritised as the first Phase 1 infrastructure task.
