/**
 * Maps a canonical profile to the frontend `Combination` shape used by serializers.
 * Serializers need the slug and combination IDs; availability is always true at build time.
 */

import type { Combination } from '../../src/types.js';
import type { CanonicalProfile } from './canonical-profile.js';

/**
 * Derives a `Combination` from a canonical profile for serializer call sites.
 */
export function toCombination(profile: CanonicalProfile): Combination {
  const { slug, combination } = profile.metadata;
  return {
    slug,
    printer: combination.printer,
    material: combination.material,
    nozzle: combination.nozzle,
    goal: combination.goal,
    isAvailable: true,
  };
}
