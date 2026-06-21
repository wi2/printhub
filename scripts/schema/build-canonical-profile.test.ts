/**
 * Tests for buildCanonicalProfile.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { CANONICAL_PROFILE_SCHEMA_VERSION } from './canonical-profile';
import type { ResolvedParams } from '../engine/types';

const FIXTURE_PARAMS: ResolvedParams = {
  firmwareFlavor: 'klipper',
  motionSystem: 'cartesian',
  bedSizeX: 250,
  bedSizeY: 210,
  maxPrintHeight: 220,
  maxSpeed: 500,
  maxAcceleration: 10000,
  travelSpeed: 200,
  printSpeed: 150,
  firstLayerSpeed: 25,
  nozzleTemp: 215,
  firstLayerNozzleTemp: 220,
  bedTemp: 55,
  firstLayerBedTemp: 60,
  fanSpeed: 100,
  fanSpeedMin: 25,
  fanKickInLayer: 2,
  retractLength: 0.8,
  retractSpeed: 45,
  deretractSpeed: 35,
  layerHeight: 0.2,
  firstLayerHeight: 0.2,
  externalPerimeterSpeed: 50,
  infillSpeed: 120,
  perimeterCount: 3,
  topSolidLayers: 5,
  bottomSolidLayers: 5,
  infillDensity: 15,
  infillPattern: 'gyroid',
  supportEnabled: false,
  nozzleDiameter: 0.4,
  lineWidth: 0.45,
  minLayerHeight: 0.08,
  maxLayerHeight: 0.30,
  maxVolumetricSpeed: 8.0,
};

describe('buildCanonicalProfile', () => {
  it('sets schemaVersion to the current canonical schema version', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    expect(profile.metadata.schemaVersion).toBe(CANONICAL_PROFILE_SCHEMA_VERSION);
  });

  it('constructs the slug from combination inputs', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    expect(profile.metadata.slug).toBe('prusa-mk4-pla-04mm-balanced');
  });

  it('records the combination in metadata', () => {
    const profile = buildCanonicalProfile('bambu-a1-mini', 'petg', '0.6', 'balanced', FIXTURE_PARAMS);
    expect(profile.metadata.combination).toEqual({
      printer: 'bambu-a1-mini',
      material: 'petg',
      nozzle: '0.6',
      goal: 'balanced',
    });
  });

  it('passes resolved parameters through unchanged', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    expect(profile.parameters).toBe(FIXTURE_PARAMS);
  });

  it('returns the same profile for identical inputs', () => {
    const profile1 = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const profile2 = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    expect(profile1).toEqual(profile2);
  });
});
