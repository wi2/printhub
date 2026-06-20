# ADR-005 — Data Persistence Strategy

**Date:** 2026-06-21  
**Status:** PROPOSED  
**Relates to:** ADR-004, future-architecture.md, future-data-model.md, roadmap-v2-v5.md

> **PROPOSED** means this ADR documents a known future decision that must be made before the relevant feature work begins. It is not approved. The context, options, and questions below are provided to structure the future decision-making session — not to pre-empt it.

---

## Context

At V1 (MVP), all storage is file-based:

- `generated/combinations.json` — static manifest
- `public/profiles/**` — static profile files on CDN
- `data/feedback.json` — append-only JSON file for feedback submissions

This is intentional: `profile-persistence.md` explicitly chose generated artifacts over a database, and the feedback store chose a JSON file to avoid operational overhead at MVP launch volume.

V2 requires:

1. `ProfileVersion` records — each build must persist a versioned record of the resolved parameter set alongside the static files
2. `Feedback` records linked to `ProfileVersion` — a queryable store that can return feedback for a specific version
3. `ValidationRecord` records — structured physical validation evidence per version

V3 requires aggregate queries over feedback (success rates, confidence scores) — queries that are impractical on a flat JSON file.

The question this ADR must answer: **what is the right persistence technology for the V2 `ProfileVersion`, `Feedback`, and `ValidationRecord` tables, and what is the trigger to migrate further?**

---

## Options Under Consideration

### Option A — SQLite (file-based, embedded)

- Single file on disk; no separate database process
- Supports SQL aggregate queries (`COUNT`, `AVG`, `GROUP BY`) for V3 stats
- Zero operational overhead vs. current JSON file approach
- Suitable for single-instance deployments; not suitable for multi-instance horizontal scale
- Existing tooling: `better-sqlite3` (Node.js); no ORM required at V2 scale

### Option B — PostgreSQL

- Fully relational, concurrent write-safe, horizontally scalable
- Significantly higher operational overhead (provisioning, backups, connection pooling)
- Justified when: feedback write volume exceeds SQLite safe concurrency limits, or when multi-instance deployment is required, or when the team grows to include a dedicated backend engineer
- Not required at V2–V3 expected volume

### Option C — Remain on JSON files + in-process aggregation

- No new dependency
- Aggregate queries require loading the full feedback file into memory for each request
- Not viable once feedback volume exceeds a few thousand records
- Not viable for relational queries (feedback ↔ ProfileVersion linkage)

---

## Questions to Resolve Before Approving

1. What is the expected feedback submission rate at V3 launch? (Drives the decision between SQLite and PostgreSQL)
2. Will the deployment be single-instance or multi-instance at V2 launch? (Multi-instance rules out SQLite)
3. Is there an existing database infrastructure that can be reused, or does this require greenfield provisioning?
4. What is the migration path from SQLite to PostgreSQL if and when it becomes necessary? (Should be agreed upfront to avoid lock-in)

---

## Anticipated Decision

SQLite is the most likely choice for V2–V3 given:
- Expected feedback volume (hundreds to low thousands of submissions at V3 scale)
- Single-instance deployment at MVP
- Zero additional operational overhead
- Precedent set by the current JSON file approach (simplicity is valued)

The anticipated trigger for graduating to PostgreSQL: either (a) concurrent write failures observed under load, (b) multi-instance deployment required, or (c) team size grows to justify the operational overhead.

---

## Related Documents

| Document | Purpose |
|---|---|
| [profile-persistence.md](../architecture/profile-persistence.md) | Current V1 persistence decisions |
| [future-architecture.md](../architecture/future-architecture.md) | §4 — Future persistence model table |
| [future-data-model.md](../delivery/future-data-model.md) | Entity definitions and migration path from V1 |
| [roadmap-v2-v5.md](../delivery/roadmap-v2-v5.md) | V2 objectives and dependencies |
