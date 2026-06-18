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

## Documents to create during delivery

| Document | Purpose |
|---|---|
| `how-to-add-a-printer.md` | Write layer file → build → physical test → manifest → deploy |
| `how-to-add-a-material.md` | Same workflow, material-specific considerations |
| `combination-validation-runbook.md` | Physical test checklist before `isAvailable: true` is set |
| `local-dev-setup.md` | How to run the project locally from a fresh checkout |
| `deployment-guide.md` | CI/CD pipeline, CDN invalidation, environment variables |
