/**
 * Tests for serializeProfileVersionRegistry.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { buildProfileVersionRegistry } from './build-profile-version-registry';
import { serializeProfileVersionRegistry } from './serialize-profile-version-registry';
import type { ResolvedParams } from '../engine/types';

const FIXTURE_PARAMS: ResolvedParams = {
  printSpeed: 150,
  layerHeight: 0.2,
  nozzleTemp: 215,
  bedTemp: 55,
};

describe('serializeProfileVersionRegistry', () => {
  it('produces valid JSON with slug keys and version records', () => {
    const registry = buildProfileVersionRegistry([
      buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS),
    ]);
    const json = serializeProfileVersionRegistry(registry);
    const parsed = JSON.parse(json) as Record<
      string,
      { currentVersion: number; versions: unknown[] }
    >;

    expect(parsed['prusa-mk4-pla-04mm-balanced']).toEqual({
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

  it('sorts slug keys alphabetically for deterministic output', () => {
    const registry = buildProfileVersionRegistry([
      buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS),
      buildCanonicalProfile('bambu-a1-mini', 'pla', '0.4', 'balanced', FIXTURE_PARAMS),
    ]);
    const json = serializeProfileVersionRegistry(registry);
    const keys = Object.keys(JSON.parse(json) as Record<string, unknown>);

    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it('produces byte-identical output for identical registries', () => {
    const registry = buildProfileVersionRegistry([
      buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS),
      buildCanonicalProfile('bambu-a1-mini', 'petg', '0.6', 'balanced', FIXTURE_PARAMS),
    ]);

    expect(serializeProfileVersionRegistry(registry)).toBe(
      serializeProfileVersionRegistry(registry),
    );
  });

  it('matches snapshot for a representative registry', () => {
    const registry = buildProfileVersionRegistry([
      buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS),
      buildCanonicalProfile('bambu-a1-mini', 'petg', '0.6', 'balanced', FIXTURE_PARAMS),
    ]);

    expect(serializeProfileVersionRegistry(registry)).toMatchSnapshot();
  });
});
