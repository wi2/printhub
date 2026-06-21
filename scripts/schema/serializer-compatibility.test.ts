/**
 * Integration tests verifying canonical profile → serializer compatibility.
 *
 * Ensures the refactored serializers produce deterministic output
 * when fed a canonical profile built from resolved params.
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalProfile } from './build-canonical-profile';
import { serialize as serializePrusaSlicer } from '../serializers/prusaslicer';
import { serialize as serializeBambuOrca } from '../serializers/bambu-orca';
import type { ResolvedParams } from '../engine/types';

const PRUSA_FIXTURE_PARAMS: ResolvedParams = {
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

const BAMBU_FIXTURE_PARAMS: ResolvedParams = {
  ...PRUSA_FIXTURE_PARAMS,
  firmwareFlavor: 'bambu',
  motionSystem: 'corexy',
  bedSizeX: 180,
  bedSizeY: 180,
  maxPrintHeight: 180,
  maxAcceleration: 5000,
  travelSpeed: 300,
  printSpeed: 200,
  firstLayerSpeed: 30,
};

describe('canonical profile serializer compatibility', () => {
  it('PrusaSlicer output is deterministic from a canonical profile', () => {
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', PRUSA_FIXTURE_PARAMS);
    const result1 = serializePrusaSlicer(profile);
    const result2 = serializePrusaSlicer(profile);
    expect(result1).toBe(result2);
  });

  it('Bambu/Orca output is deterministic from a canonical profile', () => {
    const profile = buildCanonicalProfile(
      'bambu-a1-mini',
      'pla',
      '0.4',
      'balanced',
      BAMBU_FIXTURE_PARAMS,
    );
    const result1 = serializeBambuOrca(profile);
    const result2 = serializeBambuOrca(profile);
    expect(result1.equals(result2)).toBe(true);
  });
});
