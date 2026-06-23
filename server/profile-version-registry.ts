import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProfileVersionRegistry } from '../scripts/schema/profile-version-registry.js';

export type ProfileVersionRegistryLookup = {
  hasSlug(slug: string): boolean;
  getCurrentVersion(slug: string): number | undefined;
};

/**
 * Builds a slug lookup from the build-time Profile Version Registry on disk.
 * Registry is the source of truth for currentVersion — not computed at runtime.
 */
export function createProfileVersionRegistryLookup(
  registryPath: string,
): ProfileVersionRegistryLookup {
  const registry = JSON.parse(readFileSync(registryPath, 'utf-8')) as ProfileVersionRegistry;

  return {
    hasSlug(slug) {
      return slug in registry;
    },

    getCurrentVersion(slug) {
      return registry[slug]?.currentVersion;
    },
  };
}

/**
 * Resolves generated/profile-versions/index.json from the project root.
 */
export function resolveProfileVersionRegistryPath(projectRoot: string): string {
  return join(projectRoot, 'generated', 'profile-versions', 'index.json');
}
