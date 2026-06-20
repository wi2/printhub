# Delivery Documentation

This directory contains operational guides written during and after the build phase.

## What belongs here

- Step-by-step workflows for recurring team tasks (adding a printer, adding a material, validating a combination)
- Local development setup and environment configuration
- Deployment procedures and CI/CD pipeline documentation
- Runbooks for production operations

## What does not belong here

- Architecture decisions → `docs/architecture/`
- Decisions that supersede or challenge prior architecture → `docs/decisions/`
- Product vision, personas, MVP scope → `docs/discovery/`

## Key architectural decisions for future roadmap phases

The following ADRs directly shape V2 and later work. Read these before scoping any post-MVP feature.

| ADR | Decision | Roadmap relevance |
|---|---|---|
| [ADR-004](../decisions/adr-004-json-as-canonical-profile-format.md) | JSON is the canonical internal profile format; slicer-native files are outputs only | V2 dynamic generation, V3 feedback engine, V4 community validation, V5 AI optimization |
| [ADR-003](../decisions/adr-003-deferred-physical-validation.md) | Physical validation deferred until hardware access is available | Launch readiness gate |
| [ADR-001](../decisions/adr-001-rendering-strategy.md) | CSR at MVP; SSG deferred to Phase 1 | Phase 1 SEO and rendering strategy |

## Documents to create during delivery

| Document | Purpose |
|---|---|
| `how-to-add-a-printer.md` | Write layer file → build → physical test → manifest → deploy |
| `how-to-add-a-material.md` | Same workflow, material-specific considerations |
| `combination-validation-runbook.md` | Physical test checklist before `isAvailable: true` is set |
| `local-dev-setup.md` | How to run the project locally from a fresh checkout |
| `deployment-runbook.md` | Production deploy, smoke tests, rollback |
| `backlog.md` | Deferred UX, design, and technical items identified post-MVP |
