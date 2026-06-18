# Profile Persistence — Entities vs. Artifacts

**Version:** 1.0  
**Status:** Architecture decision  
**Scope:** How profile data is stored, served, and evolved  
**Context:** The layered inheritance engine (`engine-approaches.md`) is the chosen approach. This document decides what that engine produces and where those outputs live.

---

## The Decision

Two fundamentally different models exist for how a profile "exists" in the system:

**Persisted entity** — A profile is a record in a database. The engine populates it. The application queries it at runtime. The combination slug is a database key. Changes to a profile mean updating a row.

**Generated artifact** — A profile is a file produced by the build pipeline. The engine writes it. The application serves it. The combination slug maps to a file path. Changes to a profile mean rebuilding from source.

This distinction has consequences across every layer of the stack — infrastructure, deployment, rendering, SEO, and how feedback data eventually connects back to profile quality.

---

## What Each Approach Means in Practice

Before evaluating dimensions, it is worth being precise about what each approach actually requires.

### Persisted Entity

- A database exists from day one, with a schema for profiles (combination key, parameter values, highlights, availability flag, confidence count)
- The layered inheritance engine runs either at deploy time or on demand to populate or update database records
- Application routes query the database to render profile pages
- Feedback writes directly to the profile record (incrementing `confidenceCount`, updating `failureCount`)
- A profile URL resolves by fetching a record; if the record does not exist, a 404 is returned
- Adding a new combination means running the engine, writing a record, and making it available — no re-deployment required

### Generated Artifact

- The layered inheritance engine runs in the build pipeline
- For each validated combination, it produces: a parameter-resolved data object (highlights, metadata) and a serialized slicer file (`.ini` or `.3mf`)
- These outputs are committed or uploaded as build artifacts — static files on a CDN, pre-rendered HTML pages
- The combination manifest is a JSON file produced at build time
- Feedback writes to a separate, lightweight store (a thin runtime service with a minimal schema)
- Confidence counts are fetched client-side on mount from that feedback service; they are not embedded in the static page
- Adding a new combination requires a new build and deploy

---

## Comparison

### MVP Complexity

**Persisted entity:** Requires a database at day one — schema design, connection management, ORM or query layer, migrations, a deployment pipeline that coordinates application and database changes, and an admin interface or script to run the engine and populate records. Every profile page render has a database dependency. If the database is slow or unavailable, profile pages fail.

**Generated artifact:** The build pipeline (already needed to run the layered engine) produces static files. The application serves them from a CDN. No database is required for any part of the core product flow — home page, configure form, result page, file download. The only runtime service is the feedback endpoint, which is a thin write-only API with a minimal schema (three columns: slug, outcome, timestamp).

**Verdict: Generated artifact.** The core product has one fewer operational dependency. At MVP, every moving part that can be removed should be removed. A database that only serves profile data that never changes at runtime is a moving part with no corresponding benefit at this scale.

---

### Scalability

**Persisted entity:** Profile page load scales with the database read capacity. At low traffic this is not a problem. At moderate traffic, a caching layer (Redis, CDN caching of server responses) is added in front of the database. At high traffic, that caching layer serves the vast majority of requests — which means the database is now a fallback behind a cache, not the primary serving mechanism. The system has evolved toward the artifact model by necessity.

**Generated artifact:** CDN serves profile pages with no backend involvement. Traffic spikes — a Reddit post, a YouTube video, a filament brand campaign — are absorbed at the CDN edge. Adding 200 more combinations in Phase 1 does not require capacity planning for the database; it requires a build that takes a few minutes longer.

The one scalability advantage of persisted entities is operational agility: adding a combination does not require a deployment. At MVP, with 60 pre-validated combinations that change infrequently, this advantage is not realized. At Phase 1 scale, combinations still require physical test prints before they are available — the bottleneck is validation, not deployment time.

**Verdict: Generated artifact.** Simpler to scale traffic. The deployment bottleneck is a false concern given the physical validation requirement.

---

### SEO

**Persisted entity:** Profile pages are server-rendered. Each request queries the database. Page delivery speed is variable — subject to database latency, connection pool availability, server load. Pre-rendering is possible with SSG/ISR if the database is available at build time, but this adds a runtime database dependency to the build process. Cache headers and invalidation must be managed carefully to avoid stale content.

**Generated artifact:** Profile pages are pre-rendered HTML files on a CDN. Time-to-first-byte is deterministic and near-zero — the CDN serves the file directly. Page content is stable (it does not change between builds), which means no stale content risk. Every combination page (`/profile/[slug]`) is individually indexable, has a stable canonical URL, and renders instantly. Changing the page content — for example, updating the plain-English highlights when a profile is revised — is a rebuild and redeploy, which flushes the CDN automatically.

The combination of stable URLs, instant load, and complete server-rendered HTML makes the artifact model the stronger choice for organic search performance. A profile page for "Prusa MK4 PETG 0.4mm balanced profile" that loads in under 100ms and has been indexed for three months will rank above a dynamically-rendered equivalent.

**Verdict: Generated artifact,** and not a close call. SSG is the standard architecture for content that is stable between updates and performance-sensitive for SEO.

---

### Maintainability

**Persisted entity:** Profile data exists in two places — the layer files in version control (the source) and the database (the live state). These can diverge. A layer file change that is not followed by a database sync leaves the database out of date. The source of truth is ambiguous. Schema changes require migrations coordinated with application deployments. Rolling back a bad profile change means reverting the database record, not the source file. Reasoning about "what will users see right now" requires inspecting the database, not the repository.

**Generated artifact:** The layer files in version control are the only source of truth. The build output is fully reproducible from them. "What are users seeing right now?" is answered by reading the repository at the deployed commit. A profile change is a layer file change, reviewed in a PR, built, tested, and deployed — the same workflow as any other code change. A rollback is a git revert and a build. There is no separate migration to reverse.

Profile files themselves (`.ini`, `.3mf`) are build outputs — they are not edited directly and do not live in the database. They are regenerated whenever the source changes. This means a format change (e.g., Bambu Studio updates its JSON schema) is a serializer change + rebuild, not a database migration.

**Verdict: Generated artifact.** A single source of truth in version control, a reproducible build, and no schema migration risk are each individually compelling. Together they are decisive.

---

### Future Feedback Integration

This is where the comparison is closest, and where the decision requires the most careful reasoning.

The feedback loop has two distinct jobs:

1. **Collect outcomes** — receive Yes/No/Pending responses and failure reasons. Store them anonymously against a combination slug.
2. **Surface confidence** — show users how many successful prints a profile is backed by. This number must update over time as feedback accumulates.

**Persisted entity:** Both jobs are handled in one place — the profile record. Feedback writes to `profiles.confidenceCount`. The confidence count displayed on the page is always the live database value. Simple, consistent, no architectural seams.

**Generated artifact:** The two jobs must be handled separately:

- *Collecting outcomes:* A lightweight runtime API (`POST /api/feedback`) writes to a minimal feedback table. This is a small, independently deployable service. Its schema is: `(slug, outcome, failure_reasons[], submitted_at)`.
- *Surfacing confidence:* The confidence count is the only dynamic element on an otherwise static page. It is fetched client-side on mount via a fast read endpoint (`GET /api/profile/[slug]/stats`). The page renders immediately from static data; the count appears once the fetch resolves. A successful feedback submission triggers a refetch to show the optimistic update.

This is a more complex read path for the confidence count. However, it has important properties:

- The feedback service is independently deployable and testable
- A failure in the feedback service does not affect profile page rendering
- The feedback data model is unconstrained by profile schema — it can evolve independently
- Phase 1 plans to add more sophisticated feedback analysis (combination failure rates, flagging for review) — having feedback as a separate service from profile data means this can be built without touching the profile serving layer

**The deeper question here** is whether the confidence count is profile data or feedback-derived data. It looks like profile data because it is displayed on the profile page. But it is produced entirely by feedback submissions — it has no meaning without user reports, and it updates continuously as reports come in. It does not belong in the same storage layer as the profile parameters, highlights, or file content, which are authored data.

**Verdict: Generated artifact** — with the explicit acknowledgement that a runtime feedback service is required and is part of the architecture from day one. This is not deferred. The two systems are complementary, not competing.

---

## Summary Matrix

| Dimension | Persisted Entity | Generated Artifact |
|---|---|---|
| MVP complexity | Higher — database from day one | Lower — CDN + thin feedback API |
| Traffic scalability | Requires caching layer at scale | CDN-native, no additional layer |
| SEO | Possible but variable TTFB | Pre-rendered, deterministic, fast |
| Maintainability | Dual source of truth risk | Single source of truth in version control |
| Feedback integration | Simpler (one system) | Requires separate feedback service |
| Rollback model | Database revert required | Git revert + rebuild |
| Adding a combination | No redeploy needed | Rebuild + deploy required |
| Offline reproducibility | Requires database dump | Any checkout is authoritative |

---

## Recommendation: Generated Artifacts

Profiles are build artifacts, not database records.

### The core argument

Profile data — parameters, highlights, slicer files — is **authored, validated, and stable between builds**. It does not change at runtime. It changes when a domain expert revises a layer file, which triggers a build. That workflow is identical to any other content change in the codebase. Putting stable, authored content in a database that is read at runtime adds operational complexity without adding any capability. A CDN does the same job faster, cheaper, and with no availability dependency.

The only data that must be persistent at runtime is feedback — outcomes submitted by users after printing. This is a genuinely dynamic, user-generated dataset. It belongs in a runtime store. But it is not profile data and should not share a storage layer with profile data.

### The architecture this produces

```
Source of truth (version control)
  └── Layer files (engine inputs)
  └── Safety guardrail config
  └── Import guide content

Build pipeline
  └── Layered inheritance engine resolves 60 combinations
  └── Safety guardrail pass validates all 60
  └── Serializers produce .ini and .3mf files
  └── Combination manifest (JSON) is produced
  └── SSG renders 60 profile pages (HTML)
  └── All outputs uploaded to CDN

Runtime (what runs in production)
  ├── CDN                         — serves pages, manifest, profile files
  └── Feedback service            — POST /api/feedback
                                  — GET  /api/profile/[slug]/stats
                                  — (optional) email reminder queue
```

Everything above the runtime line has no uptime requirement — it runs during deployments only. Everything below the runtime line is either read-only (CDN) or append-only (feedback). The profile serving path has no single point of failure.

### What this does not mean

Choosing artifacts over entities does not mean there will never be a database. The feedback service needs one. Phase 1 accounts (if introduced) need one. Phase 3 team features need one. The decision is specifically that **profile content** — the data produced by the layered inheritance engine — is not stored in a database. User data, feedback data, and account data will be, when those features exist.

### The one tradeoff to acknowledge

Adding a new validated combination requires a build and a deployment. For a team used to CMS-style workflows (add a record, it goes live immediately), this is a workflow change. It is justified here because:

1. A new combination must pass a physical print test before it is shown to users — the validation step is already a multi-hour process, making deployment time negligible in comparison
2. Version control over combination availability is a safety property: no combination can go live without a reviewed, auditable commit that adds it to the manifest
3. The alternative (a database toggle) removes that audit trail without meaningfully reducing the time-to-live for new combinations

This tradeoff is documented here as a known property of the decision, not a flaw to be resolved later.
