/**
 * Serializes a Profile Version Registry to deterministic JSON for build artifacts.
 *
 * Slugs and version entries are sorted for stable, snapshot-friendly output.
 */

import type { ProfileVersionRegistry } from './profile-version-registry.js';

/**
 * Serializes the registry to a formatted JSON string.
 * Output is deterministic — safe to snapshot and diff across builds.
 */
export function serializeProfileVersionRegistry(registry: ProfileVersionRegistry): string {
  const sortedRegistry = Object.fromEntries(
    Object.entries(registry)
      .sort(([slugA], [slugB]) => slugA.localeCompare(slugB))
      .map(([slug, record]) => [
        slug,
        {
          currentVersion: record.currentVersion,
          versions: [...record.versions].sort((a, b) => a.version - b.version),
        },
      ]),
  );

  return `${JSON.stringify(sortedRegistry, null, 2)}\n`;
}
