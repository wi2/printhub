/**
 * Parses a canonical profile JSON string into a typed CanonicalProfile.
 *
 * Pure function — no filesystem access. JSON parse errors and structural
 * validation failures throw descriptive errors.
 *
 * @see validate-canonical-profile.ts
 */

import type { CanonicalProfile } from './canonical-profile.js';
import { validateCanonicalProfile } from './validate-canonical-profile.js';

/**
 * Parses and validates a canonical profile JSON document.
 *
 * @param json - Raw JSON string from a canonical profile artifact.
 * @throws {Error} When JSON is malformed or fails structural validation.
 */
export function parseCanonicalProfile(json: string): CanonicalProfile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }

  return validateCanonicalProfile(parsed);
}
