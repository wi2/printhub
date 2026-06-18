/**
 * Engine-internal types for the layered parameter inheritance engine.
 *
 * Dependency rule: this file imports from nothing in the project.
 * It is the dependency root for all engine code in scripts/.
 *
 * Layer resolution order (broadest → most specific):
 *   global defaults → printer → material → goal → nozzle → combination override
 *
 * Each layer is a `LayerSchema`. The resolver merges them in order — later layers
 * win on conflict — and returns a `ResolvedParams`. The validator then checks the
 * resolved params against `GuardrailBounds` before the result enters the manifest.
 */

/**
 * A parsed YAML layer file. Each key is a slicer-agnostic parameter name;
 * each value is the parameter's setting for that layer.
 *
 * Parameter keys are open — the specific names are owned by the serializers
 * and the domain expert-authored layer files, not by this type.
 */
export type LayerSchema = Record<string, string | number | boolean>;

/**
 * The fully-merged parameter map produced by the resolver after all layers
 * have been applied in order. Same shape as `LayerSchema` — the distinction
 * matters at call sites: resolve() accepts LayerSchema[], returns ResolvedParams.
 */
export type ResolvedParams = Record<string, string | number | boolean>;

/**
 * The min/max safety bound for a single guarded parameter.
 * A value is in-bounds when min ≤ value ≤ max.
 */
export type GuardrailBound = {
  min: number;
  max: number;
};

/**
 * Safety bounds loaded from layers/guardrails.yaml.
 *
 * Each parameter key maps to a lookup table: keys are material IDs (for
 * temperature parameters), printer IDs (for speed parameters), or 'default'
 * as a fallback when no specific override exists.
 *
 * Example lookup: bounds.nozzleTemp['pla'] ?? bounds.nozzleTemp['default']
 */
export type GuardrailBounds = {
  nozzleTemp: Record<string, GuardrailBound>;
  bedTemp: Record<string, GuardrailBound>;
  printSpeed: Record<string, GuardrailBound>;
  firstLayerSpeed: Record<string, GuardrailBound>;
};

/**
 * A single guardrail violation: which parameter was out of bounds,
 * what value it had, and what the bound was.
 * Message formatting is the caller's responsibility — not encoded here.
 */
export type Violation = {
  parameter: string;
  value: number;
  bound: GuardrailBound;
};

/**
 * The result of validate(). A discriminated union — exhaustive switch on
 * `valid` to handle both cases without fallthrough.
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; violations: Violation[] };
