/**
 * Bambu Studio / Orca Slicer serializer tests.
 *
 * The snapshot test captures the JSON structure of the embedded profiles.
 * Per S-2.8 AC: "snapshot must be manually reviewed before commit."
 * Physical import validation is covered by the S-5.6 pre-launch checklist.
 */

import { describe, it, expect } from 'vitest';
import { serialize } from './bambu-orca';
import type { ResolvedParams } from '../engine/types';
import type { Combination } from '../../src/types';

/** A representative resolved parameter map for Bambu A1 Mini + PLA + 0.4mm + Balanced. */
const FIXTURE_PARAMS: ResolvedParams = {
  // Printer characteristics (from bambu-a1-mini.yaml)
  firmwareFlavor: 'bambu',
  motionSystem: 'corexy',
  bedSizeX: 180,
  bedSizeY: 180,
  maxPrintHeight: 180,
  maxSpeed: 500,
  maxAcceleration: 5000,
  travelSpeed: 300,
  printSpeed: 200,
  firstLayerSpeed: 30,
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

const FIXTURE_COMBINATION: Combination = {
  printer: 'bambu-a1-mini',
  material: 'pla',
  nozzle: '0.4',
  goal: 'balanced',
  isAvailable: true,
  slug: 'bambu-a1-mini-pla-04mm-balanced',
};

/** Helper: extracts and parses a named JSON file from the .3mf ZIP buffer. */
async function extractJson(buf: Buffer, filename: string): Promise<unknown> {
  const { unzipSync } = await import('fflate');
  const unzipped = unzipSync(new Uint8Array(buf));
  const entry = unzipped[`Metadata/${filename}`];
  if (!entry) throw new Error(`${filename} not found in archive`);
  return JSON.parse(new TextDecoder().decode(entry));
}

describe('bambu-orca serializer', () => {
  it('returns a Buffer', () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('archive contains [Content_Types].xml', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const { unzipSync } = await import('fflate');
    const unzipped = unzipSync(new Uint8Array(result));
    expect('[Content_Types].xml' in unzipped).toBe(true);
  });

  it('archive contains Metadata/process.json', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const { unzipSync } = await import('fflate');
    const unzipped = unzipSync(new Uint8Array(result));
    expect('Metadata/process.json' in unzipped).toBe(true);
  });

  it('archive contains Metadata/filament.json', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const { unzipSync } = await import('fflate');
    const unzipped = unzipSync(new Uint8Array(result));
    expect('Metadata/filament.json' in unzipped).toBe(true);
  });

  it('process profile has correct layer_height', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const process = await extractJson(result, 'process.json') as Record<string, unknown>;
    expect(process['layer_height']).toBe('0.2');
  });

  it('filament profile has correct nozzle_temperature', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const filament = await extractJson(result, 'filament.json') as Record<string, unknown>;
    expect(filament['nozzle_temperature']).toEqual(['215']);
  });

  it('filament profile has correct filament_type', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const filament = await extractJson(result, 'filament.json') as Record<string, unknown>;
    expect(filament['filament_type']).toEqual(['PLA']);
  });

  it('machine profile has correct printable_area for A1 Mini (180x180)', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const machine = await extractJson(result, 'machine.json') as Record<string, unknown>;
    expect(machine['printable_area']).toEqual(['0x0', '180x0', '180x180', '0x180']);
  });

  it('output is deterministic', () => {
    const result1 = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const result2 = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    expect(result1.equals(result2)).toBe(true);
  });

  /**
   * Snapshot test — captures the JSON structure for manual review.
   * Per S-2.8 AC: reviewed before approving this snapshot.
   */
  it('process.json matches snapshot (manually review before approving)', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const process = await extractJson(result, 'process.json');
    expect(process).toMatchSnapshot();
  });

  it('filament.json matches snapshot (manually review before approving)', async () => {
    const result = serialize(FIXTURE_PARAMS, FIXTURE_COMBINATION);
    const filament = await extractJson(result, 'filament.json');
    expect(filament).toMatchSnapshot();
  });
});
