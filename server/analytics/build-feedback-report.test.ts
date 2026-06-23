import { describe, it, expect } from 'vitest';
import type { FeedbackSession } from '../../src/types.js';
import { buildFeedbackReport } from './build-feedback-report.js';

function makeFeedback(overrides: Partial<FeedbackSession> & Pick<FeedbackSession, 'slug'>): FeedbackSession {
  return {
    outcome: 'success',
    failureReasons: [],
    profileVersion: 1,
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildFeedbackReport', () => {
  it('returns empty sections and zero totals for an empty dataset', () => {
    expect(buildFeedbackReport([])).toEqual({
      profiles: [],
      failureReasons: [],
      totals: {
        feedbackCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
      },
    });
  });

  it('combines profile metrics, failure metrics, and global totals', () => {
    const feedback = [
      makeFeedback({ slug: 'bambu-a1-mini-pla-04mm-balanced', outcome: 'success', profileVersion: 2 }),
      makeFeedback({
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        profileVersion: 1,
        failureReasons: ['Stringing or oozing', 'Warping / lifting corners'],
      }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
      makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'pending' }),
    ];

    const report = buildFeedbackReport(feedback);

    expect(report.profiles).toEqual([
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
        totalFeedback: 1,
        successCount: 0,
        failureCount: 1,
        successRate: 0,
      },
      {
        slug: 'prusa-mk4-pla-04mm-balanced',
        profileVersion: 1,
        totalFeedback: 2,
        successCount: 1,
        failureCount: 0,
        successRate: 100,
      },
    ]);

    expect(report.failureReasons).toEqual([
      {
        reason: 'Stringing or oozing',
        count: 1,
        percentage: 50,
      },
      {
        reason: 'Warping / lifting corners',
        count: 1,
        percentage: 50,
      },
    ]);

    expect(report.totals).toEqual({
      feedbackCount: 4,
      successCount: 2,
      failureCount: 1,
      successRate: (2 / 3) * 100,
    });
  });

  it('produces deterministic output for the same input', () => {
    const feedback = [
      makeFeedback({ slug: 'zebra-printer-pla-04mm-balanced', outcome: 'failure', failureReasons: ['reason-b'] }),
      makeFeedback({ slug: 'alpha-printer-pla-04mm-balanced', outcome: 'success', profileVersion: 2 }),
      makeFeedback({ slug: 'alpha-printer-pla-04mm-balanced', outcome: 'failure', profileVersion: 1, failureReasons: ['reason-a'] }),
    ];

    expect(buildFeedbackReport(feedback)).toEqual(buildFeedbackReport([...feedback]));
  });
});
