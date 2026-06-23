import type { FeedbackSession } from '../../src/types.js';
import type { ProfileMetrics } from './types.js';
import { calculateSuccessRate } from './success-rate.js';

type ProfileGroup = {
  slug: string;
  profileVersion: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
};

function groupKey(slug: string, profileVersion: number): string {
  return `${slug}\0${profileVersion}`;
}

/**
 * Aggregates feedback into per-slug, per-version metrics.
 * Results are sorted by slug ascending, then profileVersion descending.
 */
export function computeProfileMetrics(feedback: FeedbackSession[]): ProfileMetrics[] {
  const groups = new Map<string, ProfileGroup>();

  for (const record of feedback) {
    const key = groupKey(record.slug, record.profileVersion);
    let group = groups.get(key);

    if (!group) {
      group = {
        slug: record.slug,
        profileVersion: record.profileVersion,
        successCount: 0,
        failureCount: 0,
        pendingCount: 0,
      };
      groups.set(key, group);
    }

    if (record.outcome === 'success') {
      group.successCount += 1;
    } else if (record.outcome === 'failure') {
      group.failureCount += 1;
    } else {
      group.pendingCount += 1;
    }
  }

  const results = [...groups.values()].map(group => ({
    slug: group.slug,
    profileVersion: group.profileVersion,
    totalFeedback: group.successCount + group.failureCount + group.pendingCount,
    successCount: group.successCount,
    failureCount: group.failureCount,
    successRate: calculateSuccessRate(group.successCount, group.failureCount),
  }));

  results.sort((left, right) => {
    const slugCompare = left.slug.localeCompare(right.slug);
    if (slugCompare !== 0) {
      return slugCompare;
    }

    return right.profileVersion - left.profileVersion;
  });

  return results;
}
