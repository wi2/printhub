import type { FeedbackSession } from '../../src/types.js';
import { computeFailureMetrics } from './compute-failure-metrics.js';
import { computeProfileMetrics } from './compute-profile-metrics.js';
import { calculateSuccessRate } from './success-rate.js';
import type { FeedbackReport } from './types.js';

/**
 * Builds a complete analytics snapshot from feedback records.
 * Pure function — no I/O, no persistence, no profile mutation.
 * Analytics are computed from feedback records and do not modify profiles automatically.
 */
export function buildFeedbackReport(feedback: FeedbackSession[]): FeedbackReport {
  let successCount = 0;
  let failureCount = 0;

  for (const record of feedback) {
    if (record.outcome === 'success') {
      successCount += 1;
    } else if (record.outcome === 'failure') {
      failureCount += 1;
    }
  }

  return {
    profiles: computeProfileMetrics(feedback),
    failureReasons: computeFailureMetrics(feedback),
    totals: {
      feedbackCount: feedback.length,
      successCount,
      failureCount,
      successRate: calculateSuccessRate(successCount, failureCount),
    },
  };
}
