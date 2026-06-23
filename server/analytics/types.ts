/**
 * Outcome counts for a single profile version.
 * Version-level slice used when comparing revisions of the same profile.
 */
export type VersionMetrics = {
  profileVersion: number;
  totalFeedback: number;
  successCount: number;
  failureCount: number;
  /** Percentage 0–100; computed from success and failure counts only (excludes pending). */
  successRate: number;
};

/**
 * Metrics for one slug and profile version pair.
 * Each row represents feedback attributed to a specific profile revision.
 */
export type ProfileMetrics = VersionMetrics & {
  slug: string;
};

/**
 * Aggregated counts for a single failure reason across all feedback records.
 */
export type FailureReasonMetrics = {
  reason: string;
  count: number;
  /** Percentage 0–100 of total failure-reason selections. */
  percentage: number;
};

export type FeedbackReportTotals = {
  feedbackCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
};

/**
 * Complete analytics snapshot computed from feedback records.
 * Analytics are computed from feedback records and do not modify profiles automatically.
 */
export type FeedbackReport = {
  profiles: ProfileMetrics[];
  failureReasons: FailureReasonMetrics[];
  totals: FeedbackReportTotals;
};
