/**
 * Profile Version Registry types — build-time index of profile revisions per slug.
 *
 * Generated during `build:profiles` as `generated/profile-versions/index.json`.
 * Informational only at V2 Sprint 3; does not yet provide version history management.
 *
 * @see docs/delivery/future-data-model.md — ProfileVersion entity
 * @see docs/delivery/roadmap-v2-v5.md — V2 Sprint 3
 */

/** Lifecycle status for a profile version entry. Only `active` is supported at V2 Sprint 3. */
export type ProfileVersionStatus = 'active';

/** A single version record within the registry for one combination slug. */
export type ProfileVersionEntry = {
  version: number;
  slug: string;
  status: ProfileVersionStatus;
};

/** Version history and current version pointer for one combination slug. */
export type ProfileVersionRecord = {
  currentVersion: number;
  versions: ProfileVersionEntry[];
};

/**
 * Top-level registry keyed by combination slug.
 * Each slug maps to its version record (current version + version list).
 */
export type ProfileVersionRegistry = Record<string, ProfileVersionRecord>;
