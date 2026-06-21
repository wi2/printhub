/**
 * Builds a canonical JSON profile from a resolved parameter set.
 *
 * Pure function — no filesystem access, no serialization, no side effects.
 * Slug construction uses the shared `src/lib/slug.ts` utility.
 */

import { buildSlug } from '../../src/lib/slug.js';
import type { ResolvedParams } from '../engine/types.js';
import {
  CANONICAL_PROFILE_SCHEMA_VERSION,
  type CanonicalProfile,
  type CanonicalProfileCombination,
} from './canonical-profile.js';

/**
 * Constructs a typed canonical profile from combination inputs and resolved params.
 *
 * @param printer - Printer ID (e.g. `bambu-a1-mini`)
 * @param material - Material ID (e.g. `pla`)
 * @param nozzle - Nozzle ID (e.g. `0.4`)
 * @param goal - Print goal ID (e.g. `balanced`)
 * @param resolved - Fully merged parameter map from the resolver
 */
export function buildCanonicalProfile(
  printer: string,
  material: string,
  nozzle: string,
  goal: string,
  resolved: ResolvedParams,
): CanonicalProfile {
  const combination: CanonicalProfileCombination = { printer, material, nozzle, goal };
  const slug = buildSlug(printer, material, nozzle, goal);

  return {
    metadata: {
      schemaVersion: CANONICAL_PROFILE_SCHEMA_VERSION,
      slug,
      combination,
    },
    parameters: resolved,
  };
}
