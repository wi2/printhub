/**
 * Serializes a canonical profile to deterministic JSON for build artifacts.
 *
 * Parameter keys are sorted alphabetically so identical inputs always produce
 * byte-identical output regardless of layer merge order.
 */

import type { CanonicalProfile } from './canonical-profile.js';

/**
 * Serializes a canonical profile to a formatted JSON string.
 * Output is deterministic — safe to snapshot and diff across builds.
 */
export function serializeCanonicalProfileToJson(profile: CanonicalProfile): string {
  const sortedParameters = Object.fromEntries(
    Object.entries(profile.parameters).sort(([a], [b]) => a.localeCompare(b)),
  );

  const output = {
    metadata: profile.metadata,
    parameters: sortedParameters,
  };

  return `${JSON.stringify(output, null, 2)}\n`;
}
