/**
 * PrusaSlicer serializer tests.
 *
 * The snapshot test captures the full `.ini` output for a fixture input.
 * Per S-2.7 AC: "snapshot must be manually reviewed and approved before
 * being committed." The snapshot here is generated from a known fixture
 * and must be reviewed against an actual PrusaSlicer import before launch.
 *
 * Physical import validation (S-2.7 AC: "importing does not produce an
 * import error") is covered by the S-5.6 pre-launch checklist — it cannot
 * be asserted programmatically.
 */

import { describe, it, expect } from 'vitest';
import { serialize } from './prusaslicer';
import { buildCanonicalProfile } from '../schema/build-canonical-profile';
import type { ResolvedParams } from '../engine/types';

/** A representative resolved parameter map for Prusa MK4 + PLA + 0.4mm + Balanced. */
const FIXTURE_PARAMS: ResolvedParams = {
  // Printer characteristics (from prusa-mk4.yaml)
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
  // Material (from pla.yaml)
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
  // Goal (from balanced.yaml)
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
  // Nozzle (from 0.4mm.yaml)
  nozzleDiameter: 0.4,
  lineWidth: 0.45,
  minLayerHeight: 0.08,
  maxLayerHeight: 0.30,
  maxVolumetricSpeed: 8.0,
};

const FIXTURE_COMBINATION = buildCanonicalProfile(
  'prusa-mk4',
  'pla',
  '0.4',
  'balanced',
  FIXTURE_PARAMS,
);

describe('prusaslicer serializer', () => {
  it('returns a non-empty string', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('output contains all three required section headers', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('[print:');
    expect(result).toContain('[filament:');
    expect(result).toContain('[printer:');
  });

  it('output contains the combination slug in section names', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('prusa-mk4-pla-04mm-balanced');
  });

  it('emits correct layer_height', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('layer_height = 0.2');
  });

  it('emits correct nozzle temperature', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('temperature = 215');
  });

  it('emits correct bed_shape for Prusa MK4 (250x210)', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('bed_shape = 0x0,250x0,250x210,0x210');
  });

  it('emits klipper gcode_flavor for Prusa MK4', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('gcode_flavor = klipper');
  });

  it('emits marlin2 gcode_flavor for Marlin firmware', () => {
    const marlinParams = { ...FIXTURE_PARAMS, firmwareFlavor: 'marlin' };
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', marlinParams);
    const result = serialize(profile);
    expect(result).toContain('gcode_flavor = marlin2');
  });

  it('emits infill_density with percent suffix', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('infill_density = 15%');
  });

  it('emits support_material = 0 when supportEnabled is false', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toContain('support_material = 0');
  });

  it('emits support_material = 1 when supportEnabled is true', () => {
    const supportParams = { ...FIXTURE_PARAMS, supportEnabled: true };
    const profile = buildCanonicalProfile('prusa-mk4', 'pla', '0.4', 'balanced', supportParams);
    const result = serialize(profile);
    expect(result).toContain('support_material = 1');
  });

  it('output is deterministic — same input always produces same output', () => {
    const result1 = serialize(FIXTURE_COMBINATION);
    const result2 = serialize(FIXTURE_COMBINATION);
    expect(result1).toBe(result2);
  });

  /**
   * Snapshot test — captures the full .ini output for manual review.
   *
   * Per S-2.7 AC: this snapshot must be manually reviewed and approved
   * against an actual PrusaSlicer import before being considered done.
   *
   * To update the snapshot after an intentional change: run vitest with -u.
   */
  it('matches snapshot (manually review before approving)', () => {
    const result = serialize(FIXTURE_COMBINATION);
    expect(result).toMatchSnapshot();
  });
});
