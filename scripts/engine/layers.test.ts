/**
 * Layer file integrity tests.
 *
 * Verifies that every YAML layer file in layers/ can be parsed without errors
 * and conforms to its expected structure. These tests satisfy the S-2.4 AC:
 * "The build script can load both files without YAML parse errors."
 *
 * They also provide a compile-time-equivalent check for S-2.5 and S-2.6:
 * a file that cannot be parsed or is missing required keys fails CI before
 * the build script attempts to use it.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';
import { describe, it, expect } from 'vitest';
import type { GuardrailBounds, LayerSchema } from './types';

const layersDir = resolve(process.cwd(), 'layers');

function loadYaml(relativePath: string): unknown {
  const fullPath = resolve(layersDir, relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  return parse(raw);
}

// All parameter keys defined in parameter-schema.md.
// A global-defaults.yaml that omits any of these fails the S-2.4 AC:
// "provides a value for every parameter key defined in LayerSchema".
const REQUIRED_DEFAULTS: ReadonlyArray<string> = [
  // Printer characteristics
  'firmwareFlavor',
  'motionSystem',
  'bedSizeX',
  'bedSizeY',
  'maxPrintHeight',
  'maxSpeed',
  'maxAcceleration',
  'travelSpeed',
  // Speeds
  'printSpeed',
  'firstLayerSpeed',
  'externalPerimeterSpeed',
  'infillSpeed',
  // Temperatures
  'nozzleTemp',
  'firstLayerNozzleTemp',
  'bedTemp',
  'firstLayerBedTemp',
  // Cooling
  'fanSpeed',
  'fanSpeedMin',
  'fanKickInLayer',
  // Layer geometry
  'layerHeight',
  'firstLayerHeight',
  'minLayerHeight',
  'maxLayerHeight',
  // Nozzle and extrusion
  'nozzleDiameter',
  'lineWidth',
  'maxVolumetricSpeed',
  // Shell and infill
  'perimeterCount',
  'topSolidLayers',
  'bottomSolidLayers',
  'infillDensity',
  'infillPattern',
  // Retraction
  'retractLength',
  'retractSpeed',
  'deretractSpeed',
  // Support
  'supportEnabled',
];

// --- S-2.4: global defaults and guardrails ---

describe('global-defaults.yaml', () => {
  it('parses without errors', () => {
    expect(() => loadYaml('global-defaults.yaml')).not.toThrow();
  });

  it('provides a value for every required parameter key', () => {
    const defaults = loadYaml('global-defaults.yaml') as LayerSchema;
    const missing = REQUIRED_DEFAULTS.filter(key => !(key in defaults));
    expect(missing).toEqual([]);
  });

  it('contains only string, number, or boolean values', () => {
    const defaults = loadYaml('global-defaults.yaml') as LayerSchema;
    for (const [key, value] of Object.entries(defaults)) {
      const type = typeof value;
      expect(
        ['string', 'number', 'boolean'].includes(type),
        `${key} has unexpected type: ${type}`,
      ).toBe(true);
    }
  });
});

describe('guardrails.yaml', () => {
  it('parses without errors', () => {
    expect(() => loadYaml('guardrails.yaml')).not.toThrow();
  });

  it('contains all four guarded parameters', () => {
    const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
    expect(bounds).toHaveProperty('nozzleTemp');
    expect(bounds).toHaveProperty('bedTemp');
    expect(bounds).toHaveProperty('printSpeed');
    expect(bounds).toHaveProperty('firstLayerSpeed');
  });

  it('each guarded parameter has a "default" key with min and max', () => {
    const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
    for (const param of ['nozzleTemp', 'bedTemp', 'printSpeed', 'firstLayerSpeed'] as const) {
      const defaultBound = bounds[param]['default'];
      expect(defaultBound, `${param}.default is missing`).toBeDefined();
      expect(typeof defaultBound.min, `${param}.default.min`).toBe('number');
      expect(typeof defaultBound.max, `${param}.default.max`).toBe('number');
      expect(defaultBound.min).toBeLessThan(defaultBound.max);
    }
  });

  it('temperature defaults do not exceed physically safe maximums', () => {
    const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
    // No supported material should ever exceed 280°C at the nozzle.
    expect(bounds.nozzleTemp['default'].max).toBeLessThanOrEqual(280);
    // No bed should exceed 120°C — above this, PEI sheets delaminate.
    expect(bounds.bedTemp['default'].max).toBeLessThanOrEqual(120);
  });
});

// --- S-2.5: printer layer files ---

const PRINTER_FILES = [
  'printers/bambu-a1-mini.yaml',
  'printers/bambu-x1c.yaml',
  'printers/prusa-mk4.yaml',
  'printers/creality-ender-3-v3-se.yaml',
  'printers/creality-k1.yaml',
];

const REQUIRED_PRINTER_KEYS = [
  'firmwareFlavor',
  'motionSystem',
  'bedSizeX',
  'bedSizeY',
  'maxPrintHeight',
  'maxSpeed',
  'maxAcceleration',
  'travelSpeed',
  'printSpeed',
  'firstLayerSpeed',
];

const VALID_FIRMWARE_FLAVORS = ['marlin', 'klipper', 'bambu'];
const VALID_MOTION_SYSTEMS = ['cartesian', 'corexy', 'corexz'];

describe('printer layer files', () => {
  for (const file of PRINTER_FILES) {
    describe(file, () => {
      it('parses without errors', () => {
        expect(() => loadYaml(file)).not.toThrow();
      });

      it('contains all required printer keys', () => {
        const layer = loadYaml(file) as LayerSchema;
        const missing = REQUIRED_PRINTER_KEYS.filter(key => !(key in layer));
        expect(missing).toEqual([]);
      });

      it('firmwareFlavor is a valid value', () => {
        const layer = loadYaml(file) as LayerSchema;
        expect(VALID_FIRMWARE_FLAVORS).toContain(layer['firmwareFlavor']);
      });

      it('motionSystem is a valid value', () => {
        const layer = loadYaml(file) as LayerSchema;
        expect(VALID_MOTION_SYSTEMS).toContain(layer['motionSystem']);
      });

      it('printSpeed is within guardrail default ceiling', () => {
        const layer = loadYaml(file) as LayerSchema;
        const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
        const speed = layer['printSpeed'] as number;
        expect(speed).toBeGreaterThanOrEqual(bounds.printSpeed['default'].min);
        expect(speed).toBeLessThanOrEqual(bounds.printSpeed['default'].max);
      });

      it('firstLayerSpeed is within guardrail default ceiling', () => {
        const layer = loadYaml(file) as LayerSchema;
        const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
        const speed = layer['firstLayerSpeed'] as number;
        expect(speed).toBeGreaterThanOrEqual(bounds.firstLayerSpeed['default'].min);
        expect(speed).toBeLessThanOrEqual(bounds.firstLayerSpeed['default'].max);
      });
    });
  }
});

// --- S-2.6: material layer files ---

const MATERIAL_FILES = [
  'materials/pla.yaml',
  'materials/petg.yaml',
  'materials/tpu.yaml',
];

const REQUIRED_MATERIAL_KEYS = [
  'nozzleTemp',
  'firstLayerNozzleTemp',
  'bedTemp',
  'firstLayerBedTemp',
  'fanSpeed',
  'fanSpeedMin',
  'fanKickInLayer',
  'retractLength',
  'retractSpeed',
  'deretractSpeed',
];

describe('material layer files', () => {
  for (const file of MATERIAL_FILES) {
    describe(file, () => {
      it('parses without errors', () => {
        expect(() => loadYaml(file)).not.toThrow();
      });

      it('contains all required material keys', () => {
        const layer = loadYaml(file) as LayerSchema;
        const missing = REQUIRED_MATERIAL_KEYS.filter(key => !(key in layer));
        expect(missing).toEqual([]);
      });

      it('nozzleTemp is within guardrail default bounds', () => {
        const layer = loadYaml(file) as LayerSchema;
        const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
        const temp = layer['nozzleTemp'] as number;
        expect(temp).toBeGreaterThanOrEqual(bounds.nozzleTemp['default'].min);
        expect(temp).toBeLessThanOrEqual(bounds.nozzleTemp['default'].max);
      });

      it('bedTemp is within guardrail default bounds', () => {
        const layer = loadYaml(file) as LayerSchema;
        const bounds = loadYaml('guardrails.yaml') as GuardrailBounds;
        const temp = layer['bedTemp'] as number;
        expect(temp).toBeGreaterThanOrEqual(bounds.bedTemp['default'].min);
        expect(temp).toBeLessThanOrEqual(bounds.bedTemp['default'].max);
      });

      it('fanSpeed is between 0 and 100', () => {
        const layer = loadYaml(file) as LayerSchema;
        expect(layer['fanSpeed'] as number).toBeGreaterThanOrEqual(0);
        expect(layer['fanSpeed'] as number).toBeLessThanOrEqual(100);
      });
    });
  }
});

// --- S-2.6: goal layer files ---

const GOAL_FILES = [
  'goals/balanced.yaml',
  'goals/quality.yaml',
];

const REQUIRED_GOAL_KEYS = [
  'layerHeight',
  'firstLayerHeight',
  'externalPerimeterSpeed',
  'infillSpeed',
  'perimeterCount',
  'topSolidLayers',
  'bottomSolidLayers',
  'infillDensity',
  'infillPattern',
  'supportEnabled',
];

const VALID_INFILL_PATTERNS = ['gyroid', 'honeycomb', 'lines', 'grid', 'triangles'];

describe('goal layer files', () => {
  for (const file of GOAL_FILES) {
    describe(file, () => {
      it('parses without errors', () => {
        expect(() => loadYaml(file)).not.toThrow();
      });

      it('contains all required goal keys', () => {
        const layer = loadYaml(file) as LayerSchema;
        const missing = REQUIRED_GOAL_KEYS.filter(key => !(key in layer));
        expect(missing).toEqual([]);
      });

      it('infillPattern is a valid value', () => {
        const layer = loadYaml(file) as LayerSchema;
        expect(VALID_INFILL_PATTERNS).toContain(layer['infillPattern']);
      });

      it('infillDensity is between 0 and 100', () => {
        const layer = loadYaml(file) as LayerSchema;
        expect(layer['infillDensity'] as number).toBeGreaterThanOrEqual(0);
        expect(layer['infillDensity'] as number).toBeLessThanOrEqual(100);
      });

      it('layerHeight is within 0.4mm nozzle bounds', () => {
        const layer = loadYaml(file) as LayerSchema;
        const nozzle = loadYaml('nozzles/0.4mm.yaml') as LayerSchema;
        const height = layer['layerHeight'] as number;
        expect(height).toBeGreaterThanOrEqual(nozzle['minLayerHeight'] as number);
        expect(height).toBeLessThanOrEqual(nozzle['maxLayerHeight'] as number);
      });
    });
  }

  it('quality goal sets printSpeed (overrides printer layer per ADR-002)', () => {
    const quality = loadYaml('goals/quality.yaml') as LayerSchema;
    expect(quality).toHaveProperty('printSpeed');
    expect(quality).toHaveProperty('firstLayerSpeed');
  });

  it('balanced goal does not set printSpeed (printer layer owns it per ADR-002)', () => {
    const balanced = loadYaml('goals/balanced.yaml') as LayerSchema;
    expect(balanced).not.toHaveProperty('printSpeed');
    expect(balanced).not.toHaveProperty('firstLayerSpeed');
  });
});

// --- S-2.6: nozzle layer files ---

const NOZZLE_FILES = [
  'nozzles/0.4mm.yaml',
  'nozzles/0.6mm.yaml',
];

const REQUIRED_NOZZLE_KEYS = [
  'nozzleDiameter',
  'lineWidth',
  'minLayerHeight',
  'maxLayerHeight',
  'maxVolumetricSpeed',
];

describe('nozzle layer files', () => {
  for (const file of NOZZLE_FILES) {
    describe(file, () => {
      it('parses without errors', () => {
        expect(() => loadYaml(file)).not.toThrow();
      });

      it('contains all required nozzle keys', () => {
        const layer = loadYaml(file) as LayerSchema;
        const missing = REQUIRED_NOZZLE_KEYS.filter(key => !(key in layer));
        expect(missing).toEqual([]);
      });

      it('maxLayerHeight is at most 75% of nozzle diameter', () => {
        const layer = loadYaml(file) as LayerSchema;
        const diameter = layer['nozzleDiameter'] as number;
        const maxHeight = layer['maxLayerHeight'] as number;
        expect(maxHeight).toBeLessThanOrEqual(diameter * 0.75 + 0.001); // +0.001 for float tolerance
      });

      it('minLayerHeight is at least 20% of nozzle diameter', () => {
        const layer = loadYaml(file) as LayerSchema;
        const diameter = layer['nozzleDiameter'] as number;
        const minHeight = layer['minLayerHeight'] as number;
        expect(minHeight).toBeGreaterThanOrEqual(diameter * 0.20 - 0.001);
      });

      it('lineWidth is between 100% and 130% of nozzle diameter', () => {
        const layer = loadYaml(file) as LayerSchema;
        const diameter = layer['nozzleDiameter'] as number;
        const lineWidth = layer['lineWidth'] as number;
        expect(lineWidth).toBeGreaterThanOrEqual(diameter * 1.0 - 0.001);
        expect(lineWidth).toBeLessThanOrEqual(diameter * 1.30 + 0.001);
      });
    });
  }
});
