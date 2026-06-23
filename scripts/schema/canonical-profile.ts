/**
 * Canonical JSON profile types — the slicer-agnostic intermediate representation
 * between the resolver output and the format-specific serializers.
 *
 * Dependency rule: imports only from `scripts/engine/types.ts` (ResolvedParams).
 * Serializers and the build pipeline consume `CanonicalProfile`; they do not
 * read raw resolver output directly.
 *
 * @see docs/architecture/canonical-profile-model.md
 * @see docs/decisions/adr-004-json-as-canonical-profile-format.md
 */

import type { ResolvedParams } from '../engine/types';

/**
 * Schema versions the validation layer accepts at runtime.
 * Bump when the document shape changes; add migration logic in a future story.
 */
export const SUPPORTED_SCHEMA_VERSION = '1.0' as const;

/** Current canonical profile schema version. Alias of `SUPPORTED_SCHEMA_VERSION`. */
export const CANONICAL_PROFILE_SCHEMA_VERSION = SUPPORTED_SCHEMA_VERSION;

/** Identifies the printer / material / nozzle / goal combination for a profile. */
export type CanonicalProfileCombination = {
  printer: string;
  material: string;
  nozzle: string;
  goal: string;
};

/**
 * Profile identity and combination metadata.
 * Does not include build timestamps — deterministic builds omit volatile fields.
 *
 * `version` identifies the profile revision for feedback linkage.
 * Version history persistence is deferred to a later V2 story.
 */
export type CanonicalProfileMetadata = {
  schemaVersion: typeof CANONICAL_PROFILE_SCHEMA_VERSION;
  version: number;
  slug: string;
  combination: CanonicalProfileCombination;
};

/**
 * The fully-resolved 34-parameter set for a combination.
 * Same shape as `ResolvedParams` — the canonical model names the intent at
 * the profile boundary without duplicating the engine type definition.
 */
export type CanonicalProfileParameters = ResolvedParams;

/**
 * The canonical JSON profile document produced by the build pipeline.
 * This is the single authoritative representation of a combination's resolved
 * parameters before slicer-specific serialization.
 */
export type CanonicalProfile = {
  metadata: CanonicalProfileMetadata;
  parameters: CanonicalProfileParameters;
};
