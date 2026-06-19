import { describe, it, expect } from 'vitest';
import { buildSlug } from './slug';

describe('buildSlug', () => {
  it('constructs the canonical slug from all four inputs', () => {
    expect(buildSlug('bambu-a1-mini', 'pla', '0.4', 'balanced')).toBe(
      'bambu-a1-mini-pla-04mm-balanced',
    );
  });

  it('transforms 0.6mm nozzle correctly', () => {
    expect(buildSlug('bambu-x1c', 'petg', '0.6', 'quality')).toBe(
      'bambu-x1c-petg-06mm-quality',
    );
  });

  it('handles prusa printer slug correctly', () => {
    expect(buildSlug('prusa-mk4', 'pla', '0.4', 'balanced')).toBe(
      'prusa-mk4-pla-04mm-balanced',
    );
  });

  it('matches the slug format in the generated manifest', () => {
    // Verified against generated/combinations.json
    expect(buildSlug('creality-ender-3-v3-se', 'petg', '0.6', 'balanced')).toBe(
      'creality-ender-3-v3-se-petg-06mm-balanced',
    );
  });
});
