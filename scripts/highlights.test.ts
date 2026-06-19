import { describe, it, expect } from 'vitest';
import { HIGHLIGHTS } from './highlights';

/** All 20 launch combination slugs — must match LAUNCH_COMBINATIONS in build.ts. */
const LAUNCH_SLUGS = [
  'bambu-a1-mini-pla-04mm-balanced',
  'bambu-a1-mini-pla-06mm-balanced',
  'bambu-a1-mini-petg-04mm-balanced',
  'bambu-a1-mini-petg-06mm-balanced',
  'bambu-x1c-pla-04mm-balanced',
  'bambu-x1c-pla-06mm-balanced',
  'bambu-x1c-petg-04mm-balanced',
  'bambu-x1c-petg-06mm-balanced',
  'prusa-mk4-pla-04mm-balanced',
  'prusa-mk4-pla-06mm-balanced',
  'prusa-mk4-petg-04mm-balanced',
  'prusa-mk4-petg-06mm-balanced',
  'creality-ender-3-v3-se-pla-04mm-balanced',
  'creality-ender-3-v3-se-pla-06mm-balanced',
  'creality-ender-3-v3-se-petg-04mm-balanced',
  'creality-ender-3-v3-se-petg-06mm-balanced',
  'creality-k1-pla-04mm-balanced',
  'creality-k1-pla-06mm-balanced',
  'creality-k1-petg-04mm-balanced',
  'creality-k1-petg-06mm-balanced',
] as const;

describe('authored highlights (S-3.5)', () => {
  it('defines exactly three highlights for each of the 20 launch combinations', () => {
    for (const slug of LAUNCH_SLUGS) {
      const highlights = HIGHLIGHTS[slug];
      expect(highlights, `missing highlights for ${slug}`).toBeDefined();
      expect(highlights).toHaveLength(3);
    }
    expect(Object.keys(HIGHLIGHTS)).toHaveLength(LAUNCH_SLUGS.length);
  });

  it('writes each highlight as a single non-empty sentence', () => {
    for (const slug of LAUNCH_SLUGS) {
      for (const highlight of HIGHLIGHTS[slug]) {
        expect(highlight.trim().length).toBeGreaterThan(20);
        expect(highlight).toMatch(/\.$/);
        expect(highlight.split(/[.!?]\s+/).length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('does not repeat information within a highlight set', () => {
    for (const slug of LAUNCH_SLUGS) {
      const [a, b, c] = HIGHLIGHTS[slug];
      expect(a).not.toBe(b);
      expect(b).not.toBe(c);
      expect(a).not.toBe(c);
    }
  });
});
