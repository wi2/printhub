import { buildFeedbackReport } from '../analytics/build-feedback-report.js';
import type { ProfileVersionRegistryLookup } from '../profile-version-registry.js';
import type { FeedbackRepository } from '../repositories/feedback-repository.js';
import type { FailureReasonStat, ProfileStats } from './types.js';

export type ProfileStatsServiceDeps = {
  repository: FeedbackRepository;
  registry: ProfileVersionRegistryLookup;
};

export type ProfileStatsService = {
  getProfileStats(slug: string): Promise<ProfileStats | null>;
};

function toFailureReasonStats(
  failureReasons: ReturnType<typeof buildFeedbackReport>['failureReasons'],
): FailureReasonStat[] {
  return failureReasons.map(({ reason, count, percentage }) => ({
    reason,
    count,
    percentage,
  }));
}

/**
 * Transforms repository feedback into API-ready profile statistics.
 * Uses buildFeedbackReport for aggregation — no duplicated analytics logic.
 * Statistics are informational only and do not modify profile versions.
 */
export function createProfileStatsService(
  deps: ProfileStatsServiceDeps,
): ProfileStatsService {
  return {
    async getProfileStats(slug: string): Promise<ProfileStats | null> {
      const currentVersion = deps.registry.getCurrentVersion(slug);
      if (currentVersion === undefined) {
        return null;
      }

      const feedback = await deps.repository.findBySlug(slug);
      const report = buildFeedbackReport(feedback);

      return {
        slug,
        currentVersion,
        totalFeedback: report.totals.feedbackCount,
        successCount: report.totals.successCount,
        failureCount: report.totals.failureCount,
        successRate: report.totals.successRate,
        failureReasons: toFailureReasonStats(report.failureReasons),
      };
    },
  };
}
