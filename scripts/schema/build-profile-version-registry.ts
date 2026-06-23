/**
 * Builds a Profile Version Registry from canonical JSON profile instances.
 *
 * Pure function — no filesystem access, no serialization, no side effects.
 * Consumes build output before registry JSON is written.
 */

import type { CanonicalProfile } from './canonical-profile.js';
import type {
  ProfileVersionEntry,
  ProfileVersionRegistry,
  ProfileVersionRecord,
} from './profile-version-registry.js';

/**
 * Groups canonical profiles by slug, records each version, and determines
 * `currentVersion` as the highest version number for that slug.
 */
export function buildProfileVersionRegistry(
  profiles: readonly CanonicalProfile[],
): ProfileVersionRegistry {
  const versionsBySlug = new Map<string, Map<number, ProfileVersionEntry>>();

  for (const profile of profiles) {
    const { slug, version } = profile.metadata;
    const slugVersions = versionsBySlug.get(slug) ?? new Map<number, ProfileVersionEntry>();

    if (!slugVersions.has(version)) {
      slugVersions.set(version, {
        version,
        slug,
        status: 'active',
      });
    }

    versionsBySlug.set(slug, slugVersions);
  }

  const registry: ProfileVersionRegistry = {};

  for (const slug of [...versionsBySlug.keys()].sort((a, b) => a.localeCompare(b))) {
    const slugVersions = versionsBySlug.get(slug);
    if (!slugVersions) continue;

    const versions = [...slugVersions.values()].sort((a, b) => a.version - b.version);
    registry[slug] = buildProfileVersionRecord(versions);
  }

  return registry;
}

function buildProfileVersionRecord(versions: ProfileVersionEntry[]): ProfileVersionRecord {
  const currentVersion = versions.reduce(
    (max, entry) => (entry.version > max ? entry.version : max),
    versions[0]?.version ?? 0,
  );

  return { currentVersion, versions };
}
