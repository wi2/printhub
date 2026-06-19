import type { FeedbackSession } from '../src/types.js';

export type FeedbackStore = {
  insert(record: FeedbackSession): void;
  countSuccessBySlug(slug: string): number;
  clear(): void;
};

/**
 * Creates an in-memory feedback store. Each call returns an isolated instance
 * suitable for tests; production uses the singleton exported from index.ts.
 */
export function createFeedbackStore(): FeedbackStore {
  const records: FeedbackSession[] = [];

  return {
    insert(record) {
      records.push({
        slug: record.slug,
        outcome: record.outcome,
        failureReasons: [...record.failureReasons],
        submittedAt: record.submittedAt,
      });
    },

    countSuccessBySlug(slug) {
      return records.filter(
        record => record.slug === slug && record.outcome === 'success',
      ).length;
    },

    clear() {
      records.length = 0;
    },
  };
}
