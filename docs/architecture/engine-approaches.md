# Profile Generation Engine — Approach Comparison

**Version:** 1.0  
**Status:** Architecture decision pending  
**Scope:** MVP (Phase 0) engine design with Phase 1 expansion in view  
**Context:** See `system-overview.md` — profiles are built at build time, not generated at request time. The engine runs during the build pipeline to produce the 60 combination files that are then served as static assets. The choice of engine is therefore a choice about the **authoring, composition, and maintenance model** for profile data — not about runtime performance.

---

## Framing the Problem

The engine's job is:

1. Accept a combination (printer + material + nozzle + goal) as input
2. Produce a complete, valid parameter set — every required slicer parameter, no empty fields
3. Pass that parameter set through safety guardrails (temperature and speed bounds)
4. Hand it to the serialization layer to produce the target file format

The output is always the same shape. What differs across approaches is how step 2 works — where the parameter values come from and how conflicts or gaps are resolved.

The scope at MVP is 60 combinations. The Phase 1 roadmap adds 6 materials and 30 printers. Any approach must be evaluated against both scales.

---

## Approach 1 — Static File Repository

### Description

Profile files are authored entirely by hand. Each of the 60 combinations has a corresponding `.ini` and `.3mf` file committed directly to the repository. No engine logic exists. The build pipeline copies these files to the output directory and registers them in the combination manifest.

```
/profiles/
  bambu-a1-mini-pla-04mm-balanced.3mf
  bambu-a1-mini-pla-04mm-quality.3mf
  bambu-a1-mini-pla-06mm-balanced.3mf
  ...  (60 files total)
```

The combination manifest is also manually maintained — each combination's metadata (highlights, slug, availability) is written by hand alongside the file.

### Evaluation

**Complexity:** Minimal. There is no build logic to reason about, debug, or maintain. The system is as simple as a file server.

**Reliability:** Maximum. There is no code that can produce a wrong output. What is in the file is what ships. The only failure mode is a human authoring error.

**Maintainability:** Poor. Updating a single parameter — say, adjusting the default print speed for PLA across all Bambu printers — requires opening and editing multiple files with no way to make the change atomically. At 60 files it is tedious. At 240 files (Phase 1 scale) it is operationally unsafe. Shared parameters are not shared — they are duplicated.

**AI dependency:** None.

**Scalability:** Does not scale. Each new printer × material × nozzle combination adds files in every supported slicer format. Shared characteristics between similar printers are not modelled — they are copied. Parameter drift across files is inevitable.

### When this is appropriate

As a bootstrap step only — to produce the first 10–15 profiles while the engine approach is still being decided. Not suitable as the permanent architecture for anything beyond ~20 combinations.

---

## Approach 2 — Flat Parameter Table + Build-Time Serializer

### Description

All parameter values for all combinations are stored in a structured flat table — one row per combination. A build-time script reads this table and, for each row, serializes the parameters into the target slicer format.

```
combinations.yaml (excerpt)

- printer: bambu-a1-mini
  material: pla
  nozzle: 0.4
  goal: balanced
  layerHeight: 0.20
  printSpeed: 180
  firstLayerSpeed: 30
  bedTemp: 55
  nozzleTemp: 220
  coolingFanSpeed: 100
  retraction: 0.8
  retractionSpeed: 45
  infillDensity: 15
  infillPattern: gyroid
  ...  (all ~80 parameters)

- printer: bambu-a1-mini
  material: pla
  nozzle: 0.4
  goal: quality
  layerHeight: 0.12
  printSpeed: 120
  ...
```

The serializer reads each row and produces the corresponding `.ini` or `.3mf` file. The table is the single source of truth. Changing a parameter means changing one row. Adding a combination means adding one row.

### Evaluation

**Complexity:** Low. The table is human-readable and auditable. The serializer is a straightforward mapping function. The system has two distinct, independently understandable parts.

**Reliability:** High. The output is deterministic — the same table always produces the same files. Diffs are easy to review: a parameter change shows exactly which combinations are affected.

**Maintainability:** Acceptable at MVP scale. At Phase 1 scale (100+ combinations, 80+ parameters per row), the table becomes unwieldy. Common values are duplicated: if all Bambu printers share the same fan speed behavior, that value appears in every Bambu row. A change to that shared behavior requires updating every affected row correctly — error-prone without tooling.

**AI dependency:** None.

**Scalability:** Moderate. Works well up to ~100 combinations. Beyond that, duplication and maintenance overhead grow linearly with combinations. Cross-cutting changes (e.g., "update bed temperature for all PETG profiles") require either global find-and-replace (unsafe) or a scripted migration.

### When this is appropriate

A reasonable choice if the product is expected to stay at MVP scale. It becomes a liability when expansion begins in Phase 1. The lack of a shared-parameter abstraction is the key weakness.

---

## Approach 3 — Layered Parameter Inheritance (Recommended)

### Description

Parameters are organized in a hierarchy of layers. Each layer defines only the parameters that are specific to it. A resolver walks the hierarchy from broadest to most specific, applying each layer in order. The final resolved set is a complete, merged parameter map. Narrower layers override broader ones.

```
Layer order (broadest → most specific):

  [1] Global defaults
        Applies to every combination
        Sets safe, conservative values for all parameters
        e.g., firstLayerSpeed: 25, fanDelay: 3

  [2] Printer layer
        Applies to all combinations for a specific printer
        Overrides global defaults with printer-specific capabilities
        e.g., bedSize, maxSpeed, firmwareFlavor, motionSystem

  [3] Material layer
        Applies to all combinations for a specific material
        Overrides with material-specific thermal and flow properties
        e.g., nozzleTemp, bedTemp, coolingFanSpeed, retraction

  [4] Goal layer
        Applies to all combinations for a specific print goal
        Overrides with quality/speed trade-off decisions
        e.g., layerHeight, printSpeed, infillDensity, supports

  [5] Nozzle layer
        Applies to all combinations for a specific nozzle size
        Overrides volumetric throughput, min/max layer height, speeds
        e.g., maxLayerHeight, minLayerHeight, lineWidth

  [6] Combination override (optional)
        Applies only to one specific combination
        Used for edge cases where no higher layer produces the correct result
        e.g., bambu-a1-mini + tpu requires lower acceleration than other printers

  [7] Safety guardrail pass
        Not a parameter layer — a validation pass applied to the final resolved set
        Clamps temperature and speed values within per-material and per-printer bounds
        A combination that fails guardrails is rejected and does not enter the manifest
```

Each layer is a small, focused data file:

```
/engine/
  global-defaults.yaml
  printers/
    bambu-a1-mini.yaml
    bambu-x1c.yaml
    prusa-mk4.yaml
    creality-ender-3-v3-se.yaml
    creality-k1.yaml
  materials/
    pla.yaml
    petg.yaml
    tpu.yaml
  goals/
    balanced.yaml
    quality.yaml
  nozzles/
    0.4mm.yaml
    0.6mm.yaml
  overrides/
    bambu-a1-mini-tpu-balanced.yaml   (only when needed)
```

The build script resolves each of the 60 combinations by merging these layers in order, then serializes the resolved parameter set.

### Evaluation

**Complexity:** Moderate. The resolver logic (merge layers in order, later layers win) is simple to implement and simple to explain. The complexity that exists is in the data model — understanding which layer owns which parameters — not in hidden logic. A new team member can read the layer files and understand the full parameter set for any combination without running the build.

**Reliability:** High. The resolution algorithm is deterministic and has no branching logic. An unexpected parameter value in the output is always traceable to the layer that set it. Diffs at the layer level are meaningful: changing `pla.yaml` shows exactly what will change across all PLA combinations.

**Maintainability:** Excellent. This is the strongest dimension:
- Adding a 6th material (e.g., PLA-CF in Phase 1) requires one new `materials/pla-cf.yaml` file — not 10 new rows
- Updating fan speed for all PETG profiles means changing one value in `materials/petg.yaml`
- Adding a new printer means one new `printers/[name].yaml` — not a row per combination
- The override layer exists for genuine edge cases without forcing hacks into the higher layers

**AI dependency:** None.

**Scalability:** Strong. Phase 1 expansion (30 additional printers, 6 materials) adds 36 small files rather than hundreds of rows. The combination count grows but the per-combination authoring cost shrinks. Combination overrides stay rare — the inheritance model handles the common case correctly.

### Why this mirrors the domain

This is not an invented abstraction. It mirrors how slicer profiles actually work. PrusaSlicer's own profile system is a three-layer inheritance model (printer → filament → print settings). Bambu Studio separates machine profiles, filament profiles, and process profiles — the same conceptual hierarchy. Designing the engine to match this mental model means the people curating profiles (who understand slicers) will find the data structure intuitive.

### Phase 1 readiness

When Phase 1 adds an AI-assisted interpolation layer, it slots in between Layer 5 (nozzle) and Layer 6 (combination override). The AI layer is a sixth optional layer that handles novel combinations the rule layers cannot fully resolve. The existing layers are unchanged.

---

## Approach 4 — Declarative Rules Engine

### Description

Parameters are not stored as data values — they are computed by a set of declarative if/then rules evaluated against the combination inputs. The rules engine evaluates all applicable rules in priority order and resolves conflicts through a precedence system.

```
rules (conceptual):

IF material = tpu AND printer.motionSystem = corexz
  THEN acceleration ← min(acceleration, 1500)
  AND  jerk ← min(jerk, 5)
  PRIORITY: high

IF goal = quality
  THEN layerHeight ← printer.minLayerHeight
  AND  printSpeed ← 0.6 * printer.maxSpeed
  PRIORITY: medium

IF printer = bambu-a1-mini
  THEN bedSize ← [180, 180]
  AND  maxSpeed ← 500
  PRIORITY: high
```

Rules can reference printer specifications, material properties, and derived values. This enables interpolation: a rule like `nozzleTemp ← material.baseTemp + nozzle.tempCompensation` can produce a valid value for a combination that was never explicitly profiled.

### Evaluation

**Complexity:** High. Rules engines have a well-known failure mode: rule interactions. As the rule set grows, the number of possible rule combinations grows faster. A rule added for one edge case may have unintended effects on combinations it was not written for. Debugging an unexpected output requires tracing the full evaluation path — which rules fired, in what order, which won conflicts.

**Reliability:** Moderate. Individually, each rule is clear. Collectively, their interactions are not. A small rule set (20–30 rules) is manageable. A large one (200+ rules) becomes opaque. At MVP scale it is fine; at Phase 2 scale it becomes a liability.

**Maintainability:** Moderate initially, degrading over time. Adding a rule is easy. Understanding the full effect of a new rule on all existing combinations requires either exhaustive testing or expert knowledge of the full rule set. Without strong tooling (a rule conflict detector, a diff-by-combination report), the rule corpus becomes hard to audit.

**AI dependency:** None. However, this approach is architecturally closer to the Phase 4 ML engine than Approaches 2 or 3. If the plan is to eventually replace the rules with a learned model, a rules engine is a natural stepping stone — both operate on the same parameter-as-output mental model.

**Scalability:** Good for parameter coverage (rules generalize to novel combinations), poor for governance (who reviews a new rule that touches 40 combinations?).

### When this is appropriate

When the combination space is large and sparsely validated — meaning there are many combinations that have never been explicitly profiled but need a reasonable output. At MVP, with 60 pre-validated combinations, the generalization power of a rules engine is not needed and its governance overhead is not justified.

---

## Approach 5 — LLM-Assisted Parameter Generation

### Description

Profile parameters are generated by prompting a large language model with a structured description of the printer, material, nozzle size, and print goal. The model returns a parameter set. A validation layer checks the output against known bounds before the parameters are accepted.

```
Prompt (conceptual):

You are a 3D printing expert. Generate a complete PrusaSlicer profile for:
  Printer: Prusa MK4 (direct drive, 250mm/s max speed, 0.4mm nozzle)
  Material: PETG
  Goal: Balanced (quality and print time)
  ...
Return a JSON object with keys: layerHeight, printSpeed, nozzleTemp, ...
All values must be within: nozzleTemp [220-260], bedTemp [70-85], ...
```

The output is parsed, validated against safety bounds, and — if it passes — accepted as the parameter set for that combination.

### Evaluation

**Complexity:** High. Beyond prompt engineering, the architecture requires: a validation layer that checks every returned parameter against safety bounds, a retry strategy for malformed or out-of-bounds outputs, cost management (API calls per combination × combinations), latency management (LLM calls can take 5–30 seconds), and a model versioning strategy (the same prompt returns different values when the model updates). Each of these is a system that needs building, testing, and operating.

**Reliability:** Low for safety-critical parameters. LLM outputs are non-deterministic — the same prompt can return different values across calls. Temperature and speed values generated by a model must be treated as suggestions, not specifications, until validated against physical tests. The discovery review explicitly called out this risk: "LLM outputs need validation before they go into a machine control file."

**Maintainability:** Difficult. Prompt changes, model updates, and API deprecations can silently change parameter outputs for combinations that were previously correct. There is no meaningful diff between two versions of a model's understanding of PETG printing. Regression testing requires re-running and physically re-validating affected combinations.

**AI dependency:** Complete. The system cannot function without the external model API. This creates a cost floor per generation, a latency floor per generation, and an availability dependency on a third-party service. At MVP scale (60 build-time generations), the cost is negligible. At Phase 2 scale with user-submitted printer definitions, it becomes a material ongoing cost.

**Scalability:** High in theory — the model can produce output for any combination, including novel printers it has never seen explicitly. In practice, the validation and physical-testing requirement means unknown combinations still need physical verification before they can be served. The scalability advantage is not as large as it appears.

### When this is appropriate

Phase 4 (the intelligence layer described in the roadmap), when the feedback dataset is large enough (target: 50,000 rated print sessions) to validate model outputs statistically rather than through individual physical tests. The model in Phase 4 is not generating profiles blindly — it is trained on real-world print outcomes. That is a fundamentally different quality floor than an LLM operating from training data alone.

Not appropriate at MVP. The discovery review was explicit on this point.

---

## Comparison Matrix

| | Approach 1 Static Files | Approach 2 Flat Table | Approach 3 Layered Inheritance | Approach 4 Rules Engine | Approach 5 LLM-Assisted |
|---|---|---|---|---|---|
| **Complexity** | Minimal | Low | Moderate | High | High |
| **Reliability** | Maximum | High | High | Moderate | Low |
| **Maintainability** | Poor at scale | Acceptable at MVP | Excellent | Moderate, degrades | Difficult |
| **AI dependency** | None | None | None | None | Complete |
| **Scalability** | Does not scale | Moderate | Strong | Good | High (with caveats) |
| **MVP suitability** | Bootstrap only | Yes | Yes — recommended | Over-engineered | No |
| **Phase 1 suitability** | No | Stretched | Yes | Yes | No |
| **Phase 4 suitability** | No | No | Foundation layer | Foundation layer | Yes |

---

## Recommendation: Approach 3 — Layered Parameter Inheritance

### Why

**It matches the domain.** Slicer profiles already exist in a layered mental model — machine settings, material settings, quality settings — because the physical reality of 3D printing is layered in exactly the same way. A printer's bed size does not change based on material. A material's temperature range does not change based on print goal. An engine that reflects this structure is easier for domain experts to curate and audit.

**It handles Phase 1 expansion without restructuring.** The roadmap adds 30 printers and 6 materials in Phase 1. With a flat table, each new printer adds N rows per material per nozzle per goal. With a layered model, each new printer adds one file. The authoring cost per new combination drops from O(combinations) to O(unique entities).

**It localises changes.** When the PLA temperature recommendation changes (a real-world scenario — recommended temps shift as filament formulations evolve), that change is made once in `materials/pla.yaml` and propagates to all PLA combinations. With a flat table, it requires a bulk update across every PLA row.

**It is inherently safe.** Each layer is small, focused, and independently reviewable. A PR that changes `printers/bambu-a1-mini.yaml` affects exactly the Bambu A1 Mini printer layer — the change scope is unambiguous. Combined with the safety guardrail pass as a final gate, the risk of a dangerous parameter value reaching a profile file is minimised.

**It is not over-engineered for MVP.** The resolver is a merge operation — it applies layers in order and later layers win. At 60 combinations, this runs in milliseconds. The data files are small and human-readable. There is no framework to install and no query language to learn.

**It leaves the path to Phase 4 open.** When the AI-assisted layer arrives, it slots in as Layer 6 — between the nozzle layer and the combination override — for novel combinations that the rule layers cannot fully resolve. The existing layers become the fallback and the floor. The architecture accommodates the transition without restructuring.

### What the recommendation does not include

The layered inheritance engine is a **build-time** engine. It runs during the CI/CD pipeline to produce the 60 profile files that are then stored as static assets. This is consistent with the architecture decision in `system-overview.md` — at MVP, "generation" is a lookup, not runtime computation. The engine runs when a combination is added or a layer file changes, not when a user submits the form.

The engine does not handle interpolation for uncovered combinations. A combination with no validated data simply does not appear in the manifest. This is the correct behaviour at MVP and the correct starting point for Phase 1.

### Immediate next decisions required

Before implementation begins, three questions need answers:

1. **Who owns layer files?** Layer files are data, not code. They will be edited by people who understand printing, not necessarily developers. The workflow for adding or changing a parameter value — review, approval, build, physical test, deploy — needs to be defined before the first file is written.

2. **What is the conflict resolution strategy when two layers set the same parameter?** The simplest answer is "most specific layer wins." This needs to be documented as an invariant of the engine — not left as an implementation detail — because profile curators will reason about it when authoring layer files.

3. **What is the safety guardrail data source?** Guardrail bounds (e.g., PLA: max nozzle temp 240°C, TPU: max print speed 60mm/s) must live in a separate, explicitly-owned configuration — not embedded in any layer file. They are constraints on all layers, not a layer themselves. Their ownership and update process must be defined.
