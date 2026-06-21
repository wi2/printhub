import { describe, it, expect } from 'vitest';
import { getFilamentDensity } from './material-properties';

describe('getFilamentDensity', () => {
  it('returns PLA density', () => {
    expect(getFilamentDensity('pla')).toBe(1.24);
  });

  it('returns PETG density', () => {
    expect(getFilamentDensity('petg')).toBe(1.27);
  });

  it('throws for an unknown material', () => {
    expect(() => getFilamentDensity('unknown')).toThrow(/No filament density defined/);
  });
});
