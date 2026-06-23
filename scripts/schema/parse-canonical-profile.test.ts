/**
 * Tests for parseCanonicalProfile.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { parseCanonicalProfile } from './parse-canonical-profile';
import { serializeCanonicalProfileToJson } from './serialize-canonical-profile';
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

describe('parseCanonicalProfile', () => {
  it('parses and validates a canonical profile JSON string', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', FIXTURE_PARAMS);
    const json = serializeCanonicalProfileToJson(profile);

    expect(parseCanonicalProfile(json)).toEqual(profile);
  });

  it('throws a descriptive error for malformed JSON', () => {
    expect(() => parseCanonicalProfile('{ not valid json')).toThrow(/^Invalid JSON:/);
  });

  it('throws validation errors for structurally invalid JSON', () => {
    expect(() => parseCanonicalProfile('{}')).toThrow('metadata is required');
  });
});
