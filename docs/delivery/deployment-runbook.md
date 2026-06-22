# Deployment Runbook

Executable deployment guide for PrintHub MVP. Assumes a fresh checkout and no prior project knowledge.

**Related docs:** [architecture-overview.md](./architecture-overview.md) · [local-dev-setup.md](./local-dev-setup.md) · [combination-validation-runbook.md](./combination-validation-runbook.md) · [ADR-003](../decisions/adr-003-deferred-physical-validation.md)

---

## Purpose

Deploy the PrintHub MVP to production:

1. **Static frontend** — React SPA plus pre-generated profile files and manifest
2. **Feedback API** — lightweight Node.js server for `POST /api/feedback`

Profiles are **not** generated at runtime. They are built locally or in CI and shipped as static assets.

---

## Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │  Reverse proxy / CDN                │
                    │                                     │
  Browser ─────────►│  /              → dist/ (SPA)       │
                    │  /combinations.json → static file   │
                    │  /profiles/*    → static files    │
                    │  /api/feedback  → API server      │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  Node.js API (server/index.ts)      │
                    │  POST /api/feedback                 │
                    │  GET  /health                       │
                    │  data/feedback.json (persistent)    │
                    └─────────────────────────────────────┘
```

Build-time profile generation (`scripts/build.ts`) runs **before** the frontend build. See [Build profiles workflow](#build-profiles-workflow).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js **22.23.0** | Pinned in `.nvmrc` (source of truth); CI uses `node-version-file: .nvmrc` via `actions/setup-node@v6` |
| GitHub Actions | `actions/checkout@v7` and `actions/setup-node@v6` (Node 24 action runtime; application Node still from `.nvmrc`) |
| npm 10+ | Bundled with Node 22 |
| Git checkout | Clean working tree recommended |
| Persistent disk for API | Feedback store defaults to `data/feedback.json` |
| Reverse proxy | nginx, Caddy, or cloud load balancer — not included in repo |

Verify locally before deploying:

```bash
nvm use          # reads .nvmrc → 22.23.0
npm ci
npm run build:profiles
npm run build
npm run typecheck
npm run test
```

---

## Node Version

**Required:** Node.js **22.23.0** (see `.nvmrc`).

```bash
node --version   # expect v22.23.0
```

Node 16, 18, or 24+ will fail on Vite 8 / Vitest 3. Use nvm:

```bash
nvm install      # reads .nvmrc
nvm use
```

---

## Environment Variables

| Variable | Default | Used by | Purpose |
|---|---|---|---|
| `PORT` | `3001` | API server | Listen port for `server/index.ts` |
| `FEEDBACK_STORE_PATH` | `<project>/data/feedback.json` | API server | Absolute path to feedback JSON store |
| `CI` | unset | Playwright | Set to `true` in CI to disable webServer reuse |

No environment variables are required for the static frontend build.

**Production recommendations:**

- Set `FEEDBACK_STORE_PATH` to a path on persistent storage (not inside the deploy artifact directory).
- Do not commit `data/feedback.json` — it is runtime state.

---

## Build Profiles Workflow

Generates all launch profile files and the manifest.

```bash
npm run build:profiles
```

**What it does:**

1. Loads YAML layers from `layers/`
2. Resolves 20 launch combinations (PLA + PETG, 5 printers, 0.4mm + 0.6mm, Balanced goal)
3. Validates guardrails (`nozzleTemp`, `bedTemp`, `printSpeed`, `firstLayerSpeed`)
4. Serializes to PrusaSlicer `.ini` or Bambu/Orca `.3mf`
5. Writes `generated/combinations.json` and `generated/profiles/`
6. Copies artifacts to `public/` via `scripts/publish-generated.ts`

**Outputs:**

```
generated/
  combinations.json
  profiles/
    prusaslicer/*.ini
    bambu-orca/*.3mf

public/                    ← copied for Vite
  combinations.json
  profiles/…
```

**Failure handling:** Guardrail violations skip individual combinations (logged). Hard errors (missing layer file) exit code 1.

**When to re-run:** Any change to `layers/`, `scripts/`, or launch combination list. Always re-run before a frontend build.

---

## Frontend Build Workflow

```bash
npm run build
```

The `prebuild` hook runs `build:profiles` automatically, so a standalone `npm run build:profiles` is optional if you just ran it.

**Output:** `dist/` — Vite production bundle including:

- SPA assets (`index.html`, JS, CSS)
- `combinations.json`
- `profiles/` directory with all downloadable files

**Preview locally:**

```bash
npm run preview          # serves dist/ on default Vite preview port
npm run dev:server       # in a second terminal — API on :3001
```

Note: `vite preview` does not proxy `/api` unless configured separately. Use `npm run dev` for full-stack local testing.

---

## Static Profile Deployment

Deploy the entire `dist/` directory to your static host or CDN origin.

**Required paths (must be publicly reachable):**

| Path | Content |
|---|---|
| `/` | SPA entry (`index.html` + assets) |
| `/combinations.json` | Manifest — combination metadata and download paths |
| `/profiles/prusaslicer/*.ini` | PrusaSlicer profiles |
| `/profiles/bambu-orca/*.3mf` | Bambu/Orca profiles |

**Cache headers (recommended):**

| Path | Cache-Control |
|---|---|
| Hashed JS/CSS assets | `public, max-age=31536000, immutable` |
| `combinations.json` | Short TTL or invalidate on deploy (content changes with every profile rebuild) |
| Profile files | Short TTL or invalidate on deploy |

**SPA routing:** Configure the static host to serve `index.html` for unknown paths so client-side routes (`/configure`, `/profile/:slug`) work on direct navigation.

**Do not deploy `generated/` directly** — deploy `dist/` after `npm run build`, which includes the copied `public/` contents.

---

## API Deployment

Start the feedback API as a long-running Node process:

```bash
node --import tsx server/index.ts
```

Or via npm script (development-style, fine for small deployments):

```bash
npm run dev:server
```

**Production checklist:**

1. Set `PORT` (default 3001)
2. Set `FEEDBACK_STORE_PATH` to a persistent volume path
3. Ensure `public/combinations.json` or `generated/combinations.json` exists at deploy time — the API reads it for slug validation
4. Expose only `/api/feedback` and `/health` through the reverse proxy
5. Run behind the reverse proxy so `X-Forwarded-For` is set correctly for rate limiting

**Health check:**

```bash
curl -f http://localhost:3001/health
# expected: ok
```

**Process supervision:** Use systemd, Docker, or your platform's process manager. The server is a single Node HTTP listener with no clustering built in.

---

## Reverse Proxy Recommendations

Example nginx configuration (adjust paths and upstream names):

```nginx
server {
    listen 443 ssl;
    server_name printhub.example.com;

    root /var/www/printhub/dist;

    # SPA — client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static manifest and profiles (served from dist/)
    location = /combinations.json {
        add_header Cache-Control "public, max-age=300";
    }

    location /profiles/ {
        add_header Cache-Control "public, max-age=300";
    }

    # Feedback API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Optional: internal health check (do not expose publicly if unnecessary)
    location /health {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

**Key points:**

- Serve static files from `dist/` — do not route `/combinations.json` or `/profiles/*` to the API server
- Forward client IP headers — rate limiting uses `X-Forwarded-For`
- Terminate TLS at the proxy

---

## Rate Limiting Notes

Implemented in `server/rate-limit.ts` — sliding window per client IP.

| Setting | Default | Location |
|---|---|---|
| Max requests | 5 | `createRateLimiter(5, 60_000)` in `server/index.ts` |
| Window | 60 seconds | Same |
| Response on exceed | HTTP 429 `{ "error": "Too many requests" }` | `server/feedback.ts` |

**IP detection:** Uses first value in `X-Forwarded-For` when present; falls back to socket address.

**Production considerations:**

- Rate limiting is in-memory — resets on process restart; not shared across multiple API instances
- For multi-instance deployments, add edge rate limiting (nginx `limit_req`, Cloudflare, etc.) or replace with a shared store
- Feedback is fire-and-forget on the client — users see confirmation even if rate-limited; monitor 429 rates in logs

---

## Smoke Test Checklist

Run after every deployment. Replace `https://printhub.example.com` with your domain.

### Static frontend

- [ ] `GET /` returns 200 and loads the home page
- [ ] `GET /configure` returns 200 (SPA route)
- [ ] `GET /combinations.json` returns 200 with valid JSON containing 20 combinations
- [ ] `GET /profiles/prusaslicer/prusa-mk4-pla-04mm-balanced.ini` returns 200 (adjust slug as needed)
- [ ] Navigate `/configure?printer=prusa-mk4&material=pla&nozzle=0.4&goal=balanced` — generate button enabled

### Profile flow

- [ ] Select a valid combination → Generate → lands on `/profile/:slug`
- [ ] Profile page shows title, highlights, and "New profile — be the first to report results"
- [ ] Download button triggers file download
- [ ] Import guide appears after first download
- [ ] Feedback prompt visible on page load (before download)

### API

- [ ] `GET /health` returns `ok`
- [ ] `POST /api/feedback` with valid payload returns `{ "ok": true }`:

```bash
curl -X POST https://printhub.example.com/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"slug":"prusa-mk4-pla-04mm-balanced","outcome":"success"}'
```

- [ ] Invalid slug returns 404
- [ ] Sixth request within one minute from same IP returns 429

### Automated regression (optional but recommended)

```bash
npm run test:e2e
```

---

## Rollback Procedure

### Frontend (static)

1. Redeploy the previous known-good `dist/` artifact from your backup or CI artifact store
2. Invalidate CDN cache for `/combinations.json`, `/profiles/*`, and `index.html`
3. Run the [smoke test checklist](#smoke-test-checklist)

### API

1. Stop the current API process
2. Deploy the previous server build
3. **Do not delete** `data/feedback.json` unless rolling back also requires removing bad feedback entries — the store is append-only
4. Verify `GET /health` and a test feedback POST

### Profile data rollback

If a bad profile build was deployed:

1. Check out the previous git commit with known-good layers
2. Run `npm run build:profiles && npm run build`
3. Redeploy `dist/`
4. Restart API if manifest changed (slug validation reads manifest at startup)

---

## Known MVP Limitations

| Limitation | Impact |
|---|---|
| **Physical validation deferred** | All 20 combinations are `THEORETICALLY_VALID` only. Launch is blocked until PV-1/PV-2 complete per [ADR-003](../decisions/adr-003-deferred-physical-validation.md). |
| **Balanced goal only** | Quality goal layer exists but is not in the launch manifest. |
| **Static confidence count** | No stats API; all profiles show "be the first to report results." |
| **No slicer override UI** | Slicer format is derived from printer — users cannot override. |
| **File-based feedback store** | No concurrent write safety at scale; in-memory rate limiting per process. |
| **CSR only** | Profile content not in initial HTML — limited SEO on profile pages. |
| **No authentication** | Feedback endpoint is public; rate limiting is the only abuse control. |
| **Guardrail scope** | Only four parameters validated at build time. |

See [architecture-overview.md §8](./architecture-overview.md#8-known-limitations) for mitigation paths.
