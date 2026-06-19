# PrintHub

Generate validated 3D-printing profiles for popular printers in a few clicks.

PrintHub combines a layered profile engine, safety guardrails, and pre-generated slicer profiles to help users quickly find reliable settings for their printer, material, nozzle size, and printing goal.

---

## MVP Scope

Supported printers:

* Bambu A1 Mini
* Bambu X1 Carbon
* Prusa MK4
* Creality Ender 3 V3 SE
* Creality K1

Supported materials:

* PLA
* PETG

Supported nozzle sizes:

* 0.4 mm
* 0.6 mm

Supported goals:

* Balanced

---

## Tech Stack

Frontend:

* React
* TypeScript
* Vite
* React Router

Testing:

* Vitest
* Testing Library
* Playwright

Build tools:

* tsx
* YAML layer system

CI:

* GitHub Actions

---

## Project Structure

src/
scripts/
layers/
generated/
tests/
server/
docs/

---

## Installation

### Requirements

* Node.js 22.x
* npm 10+

### Clone

git clone <repository-url>
cd printhub

### Install dependencies

npm install

### Run development server

npm run dev

### Run tests

npm run test

### Run E2E tests

npm run test:e2e

### Type checking

npm run typecheck

### Build generated profiles

npm run build:profiles

### Build application

npm run build

---

## Profile Generation Pipeline

1. Load layer files
2. Resolve parameters
3. Validate guardrails
4. Serialize profile
5. Generate manifest
6. Build application

---

## Current Status

M1 — Foundation ✅

M2 — Profile Engine ✅

M3 — Frontend ✅

M4 — Runtime API ✅

M5 — Launch Gate ⏳

Pending:

* Physical printer validation
* Launch checklist sign-off

---

## License

Private project.
