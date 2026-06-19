import { describe, it, expect } from 'vitest';
import { parseConfigureParams } from './url-params';

describe('parseConfigureParams', () => {
  it('returns all four values when every query param is valid', () => {
    const params = new URLSearchParams(
      'printer=bambu-a1-mini&material=pla&nozzle=0.4&goal=balanced',
    );

    expect(parseConfigureParams(params)).toEqual({
      printer: 'bambu-a1-mini',
      material: 'pla',
      nozzle: '0.4',
      goal: 'balanced',
    });
  });

  it('silently omits an unknown printer value', () => {
    const params = new URLSearchParams(
      'printer=nonexistent&material=pla&nozzle=0.4&goal=balanced',
    );

    expect(parseConfigureParams(params)).toEqual({
      material: 'pla',
      nozzle: '0.4',
      goal: 'balanced',
    });
  });

  it('pre-fills only valid params when one param in the URL is invalid', () => {
    const params = new URLSearchParams(
      'printer=bambu-a1-mini&material=pla&nozzle=invalid&goal=balanced',
    );

    expect(parseConfigureParams(params)).toEqual({
      printer: 'bambu-a1-mini',
      material: 'pla',
      goal: 'balanced',
    });
  });

  it('returns an empty object when no recognized params are present', () => {
    expect(parseConfigureParams(new URLSearchParams(''))).toEqual({});
    expect(parseConfigureParams(new URLSearchParams('foo=bar'))).toEqual({});
  });
});
