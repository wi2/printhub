/**
 * Tests for buildProfileVersionRegistry.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { buildProfileVersionRegistry } from './build-profile-version-registry';
import type { CanonicalProfile } from './canonical-profile';
import type { ResolvedParams } from '../engine/types';

const FIXTURE_PARAMS: ResolvedParams = {
  printSpeed: 150,
  layerHeight: 0.2,
  nozzleTemp: 215,
  bedTemp: 55,
};

function makeProfile(
  printer: string,
  material: string,
  nozzle: string,
  goal: string,
  versionOverride?: number,
): CanonicalProfile {
  const profile = buildCanonicalProfile(printer, material, nozzle, goal, FIXTURE_PARAMS);
  if (versionOverride === undefined) return profile;

  return {
    ...profile,
    metadata: { ...profile.metadata, version: versionOverride },
  };
}

describe('buildProfileVersionRegistry', () => {
  it('groups profiles by slug', () => {
    const registry = buildProfileVersionRegistry([
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced'),
      makeProfile('bambu-a1-mini', 'pla', '0.4', 'balanced'),
    ]);

    expect(Object.keys(registry)).toEqual([
      'bambu-a1-mini-pla-04mm-balanced',
      'prusa-mk4-pla-04mm-balanced',
    ]);
  });

  it('sets currentVersion from metadata.version for a single-version profile', () => {
    const registry = buildProfileVersionRegistry([
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced'),
    ]);

    expect(registry['prusa-mk4-pla-04mm-balanced']).toEqual({
      currentVersion: 1,
      versions: [
        {
          version: 1,
          slug: 'prusa-mk4-pla-04mm-balanced',
          status: 'active',
        },
      ],
    });
  });

  it('uses the highest version number as currentVersion when multiple versions share a slug', () => {
    const slug = 'prusa-mk4-pla-04mm-balanced';
    const registry = buildProfileVersionRegistry([
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced', 1),
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced', 2),
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced', 3),
    ]);

    expect(registry[slug]?.currentVersion).toBe(3);
    expect(registry[slug]?.versions).toEqual([
      { version: 1, slug, status: 'active' },
      { version: 2, slug, status: 'active' },
      { version: 3, slug, status: 'active' },
    ]);
  });

  it('deduplicates identical slug and version pairs', () => {
    const registry = buildProfileVersionRegistry([
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced'),
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced'),
    ]);

    expect(registry['prusa-mk4-pla-04mm-balanced']?.versions).toHaveLength(1);
  });

  it('returns byte-identical registry objects for identical inputs', () => {
    const profiles = [
      makeProfile('prusa-mk4', 'pla', '0.4', 'balanced'),
      makeProfile('bambu-a1-mini', 'petg', '0.6', 'balanced'),
    ];

    expect(buildProfileVersionRegistry(profiles)).toEqual(buildProfileVersionRegistry(profiles));
  });
});
