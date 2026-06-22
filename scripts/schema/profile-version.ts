/**
 * Profile version utilities for canonical JSON profiles.
 *
 * At V2 Sprint 1, every generated profile starts at version 1.
 * `nextVersion()` supports future build-time increments when parameter
 * changes create a new version — no persistence layer yet.
 *
 * @see docs/delivery/future-data-model.md — ProfileVersion entity
 */

/** Initial profile version for newly generated canonical profiles. */
export const INITIAL_PROFILE_VERSION = 1;

/**
 * Returns the version assigned to newly built canonical profiles.
 * Deterministic — no timestamps or runtime generation.
 */
export function currentVersion(): number {
  return INITIAL_PROFILE_VERSION;
}

/**
 * Returns the next profile version after the given version number.
 * Used when parameter changes produce a new build artifact.
 */
export function nextVersion(version: number): number {
  return version + 1;
}
