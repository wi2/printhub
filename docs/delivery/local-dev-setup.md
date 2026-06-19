# Local Development Setup

## Node.js

Required:

* Node.js 22.x

Recommended:

* nvm

Install:

nvm install 22
nvm use 22

Verify:

node --version

Expected:

v22.x

---

## npm

Expected:

npm 10+

Verify:

npm --version

---

## First-time setup

npm install

---

## Useful commands

npm run dev

npm run build

npm run build:profiles

npm run typecheck

npm run test

npm run test:e2e

---

## Common Issues

### Node 16

Symptoms:

* Vite fails to start
* Vitest ESM errors

Cause:

Vite and Vitest require modern Node versions.

Fix:

nvm use 22

### Playwright browsers missing

Run:

npx playwright install

### Generated profiles missing

Run:

npm run build:profiles

before:

npm run build

---

## Environment

No environment variables required for MVP.
