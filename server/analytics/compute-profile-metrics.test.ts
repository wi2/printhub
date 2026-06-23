import { describe, it, expect } from 'vitest';
import type { FeedbackSession } from '../../src/types.js';
import { computeProfileMetrics } from './compute-profile-metrics.js';

function makeFeedback(overrides: Partial<FeedbackSession> & Pick<FeedbackSession, 'slug'>): FeedbackSession {
  return {
    outcome: 'success',
    failureReasons: [],
    profileVersion: 1,
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeProfileMetrics', () => {
  it('returns an empty array for an empty dataset', () => {
    expect(computeProfileMetrics([])).toEqual([]);
  });

  it('aggregates only successes with a 100% success rate', () => {
    const feedback = [
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', outcome: 'success' }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 2,
        successCount: 2,
        failureCount: 0,
        successRate: 100,
      },
    ]);
  });

  it('aggregates only failures with a 0% success rate', () => {
    const feedback = [
      makeFeedback({
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        failureReasons: ['Stringing or oozing'],
      }),
      makeFeedback({
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        failureReasons: ['Warping / lifting corners'],
      }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 2,
        successCount: 0,
        failureCount: 2,
        successRate: 0,
      },
    ]);
  });

  it('computes mixed success and failure counts with the correct success rate', () => {
    const feedback = [
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({
        slug: 'prusa-mk4-pla-04mm-balanced',
        outcome: 'failure',
        failureReasons: ['Under-extrusion (gaps, thin lines)'],
      }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'prusa-mk4-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 3,
        successCount: 2,
        failureCount: 1,
        successRate: (2 / 3) * 100,
      },
    ]);
  });

  it('groups metrics by slug and profile version separately', () => {
    const feedback = [
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', profileVersion: 2, outcome: 'success' }),
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', profileVersion: 1, outcome: 'failure', failureReasons: ['Stringing or oozing'] }),
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', profileVersion: 1, outcome: 'success' }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        profileVersion: 2,
        totalFeedback: 1,
        successCount: 1,
        failureCount: 0,
        successRate: 100,
      },
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 2,
        successCount: 1,
        failureCount: 1,
        successRate: 50,
      },
    ]);
  });

  it('aggregates multiple profiles independently', () => {
    const feedback = [
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', outcome: 'failure', failureReasons: ['Warping / lifting corners'] }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 1,
        successCount: 0,
        failureCount: 1,
        successRate: 0,
      },
      {
        slug: 'prusa-mk4-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 1,
        successCount: 1,
        failureCount: 0,
        successRate: 100,
      },
    ]);
  });

  it('includes pending submissions in totalFeedback but excludes them from success rate', () => {
    const feedback = [
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'pending' }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'failure', failureReasons: ['Layer separation'] }),
    ];

    expect(computeProfileMetrics(feedback)).toEqual([
      {
        slug: 'prusa-mk4-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 3,
        successCount: 1,
        failureCount: 1,
        successRate: 50,
      },
    ]);
  });

  it('returns deterministic ordering by slug ascending then version descending', () => {
    const feedback = [
      makeFeedback({ slug: 'zebra-printer-pla-04mm-balanced', profileVersion: 1, outcome: 'success' }),
      makeFeedback({ slug: 'alpha-printer-pla-04mm-balanced', profileVersion: 3, outcome: 'success' }),
      makeFeedback({ slug: 'alpha-printer-pla-04mm-balanced', profileVersion: 1, outcome: 'success' }),
      makeFeedback({ slug: 'alpha-printer-pla-04mm-balanced', profileVersion: 2, outcome: 'success' }),
    ];

    const metrics = computeProfileMetrics(feedback);

    expect(metrics.map(entry => `${entry.slug}:v${entry.profileVersion}`)).toEqual([
      'alpha-printer-pla-04mm-balanced:v3',
      'alpha-printer-pla-04mm-balanced:v2',
      'alpha-printer-pla-04mm-balanced:v1',
      'zebra-printer-pla-04mm-balanced:v1',
    ]);
  });
});
