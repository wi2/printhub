/**
 * Tests for canonical profile JSON serialization.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { serializeCanonicalProfileToJson } from './serialize-canonical-profile';
import type { ResolvedParams } from '../engine/types';

const FIXTURE_PARAMS: ResolvedParams = {
  printSpeed: 150,
  layerHeight: 0.2,
  nozzleTemp: 215,
  bedTemp: 55,
};

describe('serializeCanonicalProfileToJson', () => {
  it('produces valid JSON with metadata and parameters keys', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json = serializeCanonicalProfileToJson(profile);
    const parsed = JSON.parse(json) as { metadata: unknown; parameters: unknown };

    expect(parsed.metadata).toBeDefined();
    expect(parsed.parameters).toBeDefined();
  });

  it('includes schemaVersion and slug in metadata', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json = serializeCanonicalProfileToJson(profile);
    const parsed = JSON.parse(json) as {
      metadata: { schemaVersion: string; slug: string };
    };

    expect(parsed.metadata.schemaVersion).toBe('1.0');
    expect(parsed.metadata.slug).toBe('prusa-mk4-pla-04mm-balanced');
  });

  it('sorts parameter keys alphabetically for deterministic output', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json = serializeCanonicalProfileToJson(profile);
    const keys = Object.keys(
      (JSON.parse(json) as { parameters: Record<string, unknown> }).parameters,
    );

    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it('produces byte-identical output for identical profiles', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json1 = serializeCanonicalProfileToJson(profile);
    const json2 = serializeCanonicalProfileToJson(profile);
    expect(json1).toBe(json2);
  });

  it('matches snapshot for a representative profile', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json = serializeCanonicalProfileToJson(profile);
    expect(json).toMatchSnapshot();
  });
});
