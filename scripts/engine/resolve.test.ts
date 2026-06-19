// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { LayerSchema } from './types';
import { resolve } from './resolve';

describe('resolve', () => {
  it('returns an empty object for an empty layer array', () => {
    const result = resolve([]);

    expect(result).toEqual({});
  });

  it('returns identical parameters for a single layer', () => {
    const global: LayerSchema = {
      printSpeed: 60,
      nozzleTemp: 210,
      layerHeight: 0.2,
      fanKickInLayer: 1,
    };

    const result = resolve([global]);

    expect(result).toEqual({
      printSpeed: 60,
      nozzleTemp: 210,
      layerHeight: 0.2,
      fanKickInLayer: 1,
    });
  });

  it('goal layer value overrides material layer value for the same key', () => {
    // printSpeed is set by the material layer first, then overridden by the goal layer.
    // The goal layer is more specific — it wins.
    const material: LayerSchema = { nozzleTemp: 220, fanKickInLayer: 3, printSpeed: 40 };
    const goal: LayerSchema = { layerHeight: 0.2, printSpeed: 180 };

    const result = resolve([material, goal]);

    expect(result.printSpeed).toBe(180);
  });

  it('preserves fields not set by later layers (global default fallthrough)', () => {
    // nozzleTemp is only set in the global layer. The goal layer does not mention it.
    // The resolved output must still contain the global value.
    const global: LayerSchema = { nozzleTemp: 210, printSpeed: 60, fanKickInLayer: 1 };
    const goal: LayerSchema = { layerHeight: 0.2, printSpeed: 180 };

    const result = resolve([global, goal]);

    expect(result.nozzleTemp).toBe(210);
    expect(result.fanKickInLayer).toBe(1);
  });

  it('override layer value overrides all other layers for the same key', () => {
    // layerHeight flows through global → goal, then the combination override
    // sets a specific value that must win over every earlier layer.
    const global: LayerSchema = { layerHeight: 0.2, printSpeed: 60 };
    const goal: LayerSchema = { layerHeight: 0.2, printSpeed: 180 };
    const override: LayerSchema = { layerHeight: 0.16 };

    const result = resolve([global, goal, override]);

    expect(result.layerHeight).toBe(0.16);
    // printSpeed is not in the override — the goal value must be preserved
    expect(result.printSpeed).toBe(180);
  });

  it('resolves without error when no override layer is present', () => {
    const global: LayerSchema = { nozzleTemp: 210, printSpeed: 60, fanKickInLayer: 1 };
    const printer: LayerSchema = { printSpeed: 250 };
    const material: LayerSchema = { nozzleTemp: 220, fanKickInLayer: 3 };
    const goal: LayerSchema = { layerHeight: 0.2, printSpeed: 180 };
    const nozzle: LayerSchema = { layerHeight: 0.2 };

    // No override layer — five layers only
    expect(() => resolve([global, printer, material, goal, nozzle])).not.toThrow();

    const result = resolve([global, printer, material, goal, nozzle]);

    expect(result.nozzleTemp).toBe(220);
    expect(result.printSpeed).toBe(180);
    expect(result.fanKickInLayer).toBe(3);
    expect(result.layerHeight).toBe(0.2);
  });
});
