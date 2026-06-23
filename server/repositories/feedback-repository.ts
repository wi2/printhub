import type { FeedbackSession } from '../../src/types.js';

/**
 * Persistence contract for feedback records.
 * Business logic must not depend on storage implementation details.
 */
export interface FeedbackRepository {
  save(feedback: FeedbackSession): Promise<void>;

  findAll(): Promise<FeedbackSession[]>;

  findBySlug(slug: string): Promise<FeedbackSession[]>;

  findBySlugAndVersion(
    slug: string,
    profileVersion: number,
  ): Promise<FeedbackSession[]>;
}
