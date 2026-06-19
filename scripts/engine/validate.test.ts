// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { GuardrailBounds, ResolvedParams } from './types';
import { validate } from './validate';

/**
 * Representative bounds using realistic PLA/printer values from parameter-schema.md.
 *
 * nozzleTemp / bedTemp — per-material bounds (PLA safe range)
 * printSpeed / firstLayerSpeed — per-printer bounds (mid-range printer)
 */
const defaultBounds: GuardrailBounds = {
  nozzleTemp: { default: { min: 170, max: 240 } },
  bedTemp: { default: { min: 0, max: 80 } },
  printSpeed: { default: { min: 0, max: 300 } },
  firstLayerSpeed: { default: { min: 0, max: 50 } },
};

/** A fully valid PLA profile at conservative settings — all values well within bounds. */
const validParams: ResolvedParams = {
  nozzleTemp: 215,
  bedTemp: 60,
  printSpeed: 180,
  firstLayerSpeed: 30,
  layerHeight: 0.2,
  infillDensity: 15,
};

describe('validate', () => {
  it('returns valid: true when all guarded parameters are within bounds', () => {
    const result = validate(validParams, defaultBounds);

    expect(result.valid).toBe(true);
  });

  it('rejects a nozzle temperature below the material minimum', () => {
    // 160°C is below the PLA minimum of 170°C — material will not melt reliably
    const params: ResolvedParams = { ...validParams, nozzleTemp: 160 };

    const result = validate(params, defaultBounds);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].parameter).toBe('nozzleTemp');
      expect(result.violations[0].value).toBe(160);
      expect(result.violations[0].bound).toEqual({ min: 170, max: 240 });
    }
  });

  it('rejects a nozzle temperature above the material maximum', () => {
    // 260°C exceeds the PLA maximum of 240°C — risks thermal runaway and material degradation
    const params: ResolvedParams = { ...validParams, nozzleTemp: 260 };

    const result = validate(params, defaultBounds);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].parameter).toBe('nozzleTemp');
      expect(result.violations[0].value).toBe(260);
      expect(result.violations[0].bound).toEqual({ min: 170, max: 240 });
    }
  });

  it('rejects a print speed above the printer maximum', () => {
    // 350 mm/s exceeds the printer maximum of 300 mm/s — risks motion artifacts
    const params: ResolvedParams = { ...validParams, printSpeed: 350 };

    const result = validate(params, defaultBounds);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].parameter).toBe('printSpeed');
      expect(result.violations[0].value).toBe(350);
      expect(result.violations[0].bound).toEqual({ min: 0, max: 300 });
    }
  });

  it('reports all violations when multiple parameters are out of bounds', () => {
    // Both temperature and speed are out of bounds — every violation must be returned
    const params: ResolvedParams = {
      ...validParams,
      nozzleTemp: 260, // above PLA max 240
      bedTemp: 95, // above max 80
      printSpeed: 350, // above printer max 300
    };

    const result = validate(params, defaultBounds);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations).toHaveLength(3);
      const paramNames = result.violations.map((v) => v.parameter);
      expect(paramNames).toContain('nozzleTemp');
      expect(paramNames).toContain('bedTemp');
      expect(paramNames).toContain('printSpeed');
    }
  });

  it('ignores parameters that are not guarded (non-safety-critical keys)', () => {
    // layerHeight and infillDensity have no bounds — they must not cause violations
    const params: ResolvedParams = {
      nozzleTemp: 215,
      bedTemp: 60,
      printSpeed: 180,
      firstLayerSpeed: 30,
      layerHeight: 999, // nonsensical value — not guarded, must be ignored
      infillDensity: 999, // same
      firmwareFlavor: 'marlin', // string param — not guarded
    };

    const result = validate(params, defaultBounds);

    expect(result.valid).toBe(true);
  });
});
