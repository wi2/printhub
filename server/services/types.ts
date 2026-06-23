/**
 * API-facing profile statistics types.
 * Decoupled from internal analytics types in server/analytics/types.ts.
 */

/** Aggregated failure reason counts for a single profile slug. */
export type FailureReasonStat = {
  reason: string;
  count: number;
  /** Percentage 0–100 of total failure-reason selections for this profile. */
  percentage: number;
};

/**
 * Profile-level statistics returned by GET /api/profiles/:slug/stats.
 * Statistics are informational only and do not modify profile versions.
 */
export type ProfileStats = {
  slug: string;
  currentVersion: number;
  totalFeedback: number;
  successCount: number;
  failureCount: number;
  /** Percentage 0–100; computed from success and failure counts only (excludes pending). */
  successRate: number;
  failureReasons: FailureReasonStat[];
};
