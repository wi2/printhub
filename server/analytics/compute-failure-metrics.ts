import type { FeedbackSession } from '../../src/types.js';
import type { FailureReasonMetrics } from './types.js';

/**
 * Aggregates failure reason selections across all failure outcomes.
 * Unknown and future reason strings are counted automatically — no hardcoded categories.
 * Results are sorted by count descending, then reason ascending for deterministic ties.
 */
export function computeFailureMetrics(feedback: FeedbackSession[]): FailureReasonMetrics[] {
  const counts = new Map<string, number>();

  for (const record of feedback) {
    if (record.outcome !== 'failure') {
      continue;
    }

    for (const reason of record.failureReasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  const totalReasonSelections = [...counts.values()].reduce((sum, count) => sum + count, 0);

  const results = [...counts.entries()].map(([reason, count]) => ({
    reason,
    count,
    percentage: totalReasonSelections === 0 ? 0 : (count / totalReasonSelections) * 100,
  }));

  results.sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.reason.localeCompare(right.reason);
  });

  return results;
}
