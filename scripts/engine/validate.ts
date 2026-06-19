import type { GuardrailBounds, ResolvedParams, ValidationResult, Violation } from './types';

/**
 * The four parameter keys the validator checks, matching the four fields
 * on GuardrailBounds. Parameters not in this list are ignored.
 */
const GUARDED_PARAMS = ['nozzleTemp', 'bedTemp', 'printSpeed', 'firstLayerSpeed'] as const;

/**
 * Checks a resolved parameter map against safety bounds.
 *
 * Returns `{ valid: true }` when every guarded parameter is within its bound.
 * Returns `{ valid: false, violations }` when one or more values fall outside
 * their bound — every violation is reported, not only the first.
 *
 * Parameters absent from the resolved map are skipped — the validator does not
 * require every guarded parameter to be present.
 *
 * The bounds object is keyed by material ID (for temperature params) or printer
 * ID (for speed params), with `'default'` as the fallback. At MVP the build
 * script (S-2.9) is responsible for selecting the right lookup key; the
 * validator always falls back to `'default'` if no specific key matches.
 *
 * Pure function. No file I/O. Does not modify the parameter map.
 */
export function validate(params: ResolvedParams, bounds: GuardrailBounds): ValidationResult {
  const violations: Violation[] = [];

  for (const param of GUARDED_PARAMS) {
    const value = params[param];
    if (value === undefined || typeof value !== 'number') continue;

    const bound = bounds[param]['default'];
    if (bound === undefined) continue;

    if (value < bound.min || value > bound.max) {
      violations.push({ parameter: param, value, bound });
    }
  }

  if (violations.length === 0) {
    return { valid: true };
  }

  return { valid: false, violations };
}
