/**
 * Tests for validateCanonicalProfile.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { validateCanonicalProfile } from './validate-canonical-profile';
import type { ResolvedParams } from '../engine/types';
import type { CanonicalProfile } from './canonical-profile';

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

function makeValidProfile(): CanonicalProfile {
  return buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
}

describe('validateCanonicalProfile', () => {
  it('accepts a valid canonical profile', () => {
    const profile = makeValidProfile();
    expect(validateCanonicalProfile(profile)).toEqual(profile);
  });

  it('rejects an unsupported schema version', () => {
    const profile = makeValidProfile();
    const invalid = {
      ...profile,
      metadata: { ...profile.metadata, schemaVersion: '2.0' },
    };

    expect(() => validateCanonicalProfile(invalid)).toThrow(
      'Unsupported schema version "2.0" (supported: "1.0")',
    );
  });

  it('rejects missing metadata', () => {
    const profile = makeValidProfile();
    const { metadata: _metadata, ...withoutMetadata } = profile;

    expect(() => validateCanonicalProfile(withoutMetadata)).toThrow('metadata is required');
  });

  it('rejects missing parameters', () => {
    const profile = makeValidProfile();
    const { parameters: _parameters, ...withoutParameters } = profile;

    expect(() => validateCanonicalProfile(withoutParameters)).toThrow('parameters is required');
  });

  it('rejects a missing required parameter', () => {
    const profile = makeValidProfile();
    const { printSpeed: _printSpeed, ...rest } = profile.parameters;

    expect(() =>
      validateCanonicalProfile({ ...profile, parameters: rest }),
    ).toThrow('parameters missing required keys: printSpeed');
  });

  it('rejects unknown parameters', () => {
    const profile = makeValidProfile();

    expect(() =>
      validateCanonicalProfile({
        ...profile,
        parameters: { ...profile.parameters, mysterySetting: 42 },
      }),
    ).toThrow('parameters contain unknown keys: mysterySetting');
  });

  it('rejects an invalid version', () => {
    const profile = makeValidProfile();
    const invalid = {
      ...profile,
      metadata: { ...profile.metadata, version: 0 },
    };

    expect(() => validateCanonicalProfile(invalid)).toThrow(
      'metadata.version must be a positive integer',
    );
  });

  it('rejects a slug that does not match the combination', () => {
    const profile = makeValidProfile();
    const invalid = {
      ...profile,
      metadata: { ...profile.metadata, slug: 'wrong-slug' },
    };

    expect(() => validateCanonicalProfile(invalid)).toThrow(
      'metadata.slug "wrong-slug" does not match combination (expected "prusa-mk4-pla-04mm-balanced")',
    );
  });

  it('rejects a parameter with the wrong primitive type', () => {
    const profile = makeValidProfile();

    expect(() =>
      validateCanonicalProfile({
        ...profile,
        parameters: { ...profile.parameters, printSpeed: 'fast' },
      }),
    ).toThrow('parameters.printSpeed must be number, got string');
  });

  it('rejects non-object root input', () => {
    expect(() => validateCanonicalProfile(null)).toThrow('profile must be an object');
    expect(() => validateCanonicalProfile('not-a-profile')).toThrow('profile must be an object');
  });
});
