import { describe, it, expect } from 'vitest';
import type { FeedbackSession } from '../../src/types.js';
import { computeFailureMetrics } from './compute-failure-metrics.js';

function makeFeedback(overrides: Partial<FeedbackSession> & Pick<FeedbackSession, 'slug'>): FeedbackSession {
  return {
    outcome: 'failure',
    failureReasons: [],
    profileVersion: 1,
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeFailureMetrics', () => {
  it('returns an empty array for an empty dataset', () => {
    expect(computeFailureMetrics([])).toEqual([]);
  });

  it('returns an empty array when there are no failure outcomes', () => {
    const feedback = [
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success', failureReasons: [] }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'pending', failureReasons: [] }),
    ];

    expect(computeFailureMetrics(feedback)).toEqual([]);
  });

  it('aggregates a single failure reason', () => {
    const feedback = [
      makeFeedback({
        slug: 'prusa-mk4-pla-04mm-balanced',
        failureReasons: ['Stringing or oozing'],
      }),
      makeFeedback({
        slug: 'prusa-mk4-pla-04mm-balanced',
        failureReasons: ['Stringing or oozing'],
      }),
    ];

    expect(computeFailureMetrics(feedback)).toEqual([
      {
        reason: 'Stringing or oozing',
        count: 2,
        percentage: 100,
      },
    ]);
  });

  it('aggregates multiple preset failure reasons with correct percentages', () => {
    const feedback = [
      makeFeedback({ slug: 'a-slug', failureReasons: ['Stringing or oozing'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['Stringing or oozing', 'Warping / lifting corners'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['Under-extrusion (gaps, thin lines)'] }),
    ];

    expect(computeFailureMetrics(feedback)).toEqual([
      {
        reason: 'Stringing or oozing',
        count: 2,
        percentage: 50,
      },
      {
        reason: 'Under-extrusion (gaps, thin lines)',
        count: 1,
        percentage: 25,
      },
      {
        reason: 'Warping / lifting corners',
        count: 1,
        percentage: 25,
      },
    ]);
  });

  it('supports unknown and future failure reasons without hardcoded categories', () => {
    const feedback = [
      makeFeedback({ slug: 'a-slug', failureReasons: ['custom-reason-alpha'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['custom-reason-beta'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['custom-reason-beta'] }),
    ];

    expect(computeFailureMetrics(feedback)).toEqual([
      {
        reason: 'custom-reason-beta',
        count: 2,
        percentage: (2 / 3) * 100,
      },
      {
        reason: 'custom-reason-alpha',
        count: 1,
        percentage: (1 / 3) * 100,
      },
    ]);
  });

  it('ignores empty failureReasons arrays on failure outcomes', () => {
    const feedback = [
      makeFeedback({ slug: 'a-slug', failureReasons: [] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['Stringing or oozing'] }),
    ];

    expect(computeFailureMetrics(feedback)).toEqual([
      {
        reason: 'Stringing or oozing',
        count: 1,
        percentage: 100,
      },
    ]);
  });

  it('sorts by count descending and reason ascending for deterministic ties', () => {
    const feedback = [
      makeFeedback({ slug: 'a-slug', failureReasons: ['reason-b'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['reason-a'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['reason-c'] }),
      makeFeedback({ slug: 'a-slug', failureReasons: ['reason-c'] }),
    ];

    const metrics = computeFailureMetrics(feedback);

    expect(metrics.map(entry => entry.reason)).toEqual(['reason-c', 'reason-a', 'reason-b']);
    expect(metrics[0]?.count).toBe(2);
    expect(metrics[1]?.count).toBe(1);
    expect(metrics[2]?.count).toBe(1);
  });
});
