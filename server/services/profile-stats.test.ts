import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { FeedbackSession } from '../../src/types.js';
import { createProfileVersionRegistryLookup } from '../profile-version-registry.js';
import type { FeedbackRepository } from '../repositories/feedback-repository.js';
import { createProfileStatsService } from './profile-stats.js';

function makeFeedback(
  overrides: Partial<FeedbackSession> & Pick<FeedbackSession, 'slug'>,
): FeedbackSession {
  return {
    outcome: 'success',
    failureReasons: [],
    profileVersion: 1,
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

class InMemoryFeedbackRepository implements FeedbackRepository {
  constructor(private readonly records: FeedbackSession[]) {}

  async save(): Promise<void> {
    throw new Error('Not implemented');
  }

  async findAll(): Promise<FeedbackSession[]> {
    return this.records.map(record => ({
      ...record,
      failureReasons: [...record.failureReasons],
    }));
  }

  async findBySlug(slug: string): Promise<FeedbackSession[]> {
    return (await this.findAll()).filter(record => record.slug === slug);
  }

  async findBySlugAndVersion(
    slug: string,
    profileVersion: number,
  ): Promise<FeedbackSession[]> {
    return (await this.findAll()).filter(
      record => record.slug === slug && record.profileVersion === profileVersion,
    );
  }
}

const registry = createProfileVersionRegistryLookup(
  fileURLToPath(new URL('../../tests/fixtures/profile-versions.json', import.meta.url)),
);

describe('createProfileStatsService', () => {
  describe('getProfileStats', () => {
    it('returns aggregated stats for a profile with feedback', async () => {
      const repository = new InMemoryFeedbackRepository([
        makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
        makeFeedback({ slug: 'prusa-mk4-pla-04mm-balanced', outcome: 'success' }),
        makeFeedback({
          slug: 'prusa-mk4-pla-04mm-balanced',
          outcome: 'failure',
          failureReasons: ['Stringing or oozing'],
        }),
      ]);
      const service = createProfileStatsService({ repository, registry });

      await expect(service.getProfileStats('prusa-mk4-pla-04mm-balanced')).resolves.toEqual({
        slug: 'prusa-mk4-pla-04mm-balanced',
        currentVersion: 1,
        totalFeedback: 3,
        successCount: 2,
        failureCount: 1,
        successRate: (2 / 3) * 100,
        failureReasons: [
          {
            reason: 'Stringing or oozing',
            count: 1,
            percentage: 100,
          },
        ],
      });
    });

    it('returns zeroed stats when a known profile has no feedback', async () => {
      const repository = new InMemoryFeedbackRepository([]);
      const service = createProfileStatsService({ repository, registry });

      await expect(service.getProfileStats('prusa-mk4-pla-04mm-balanced')).resolves.toEqual({
        slug: 'prusa-mk4-pla-04mm-balanced',
        currentVersion: 1,
        totalFeedback: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        failureReasons: [],
      });
    });

    it('aggregates feedback across multiple profile versions', async () => {
      const repository = new InMemoryFeedbackRepository([
        makeFeedback({
          slug: 'bambu-a1-mini-pla-04mm-balanced',
          outcome: 'success',
          profileVersion: 2,
        }),
        makeFeedback({
          slug: 'bambu-a1-mini-pla-04mm-balanced',
          outcome: 'failure',
          profileVersion: 1,
          failureReasons: ['Warping / lifting corners'],
        }),
        makeFeedback({
          slug: 'bambu-a1-mini-pla-04mm-balanced',
          outcome: 'pending',
          profileVersion: 2,
        }),
      ]);
      const service = createProfileStatsService({ repository, registry });

      await expect(service.getProfileStats('bambu-a1-mini-pla-04mm-balanced')).resolves.toEqual({
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        currentVersion: 2,
        totalFeedback: 3,
        successCount: 1,
        failureCount: 1,
        successRate: 50,
        failureReasons: [
          {
            reason: 'Warping / lifting corners',
            count: 1,
            percentage: 100,
          },
        ],
      });
    });

    it('aggregates failure reasons with counts and percentages', async () => {
      const repository = new InMemoryFeedbackRepository([
        makeFeedback({
          slug: 'prusa-mk4-pla-04mm-balanced',
          outcome: 'failure',
          failureReasons: ['Stringing or oozing', 'Warping / lifting corners'],
        }),
        makeFeedback({
          slug: 'prusa-mk4-pla-04mm-balanced',
          outcome: 'failure',
          failureReasons: ['Stringing or oozing', 'Stringing or oozing'],
        }),
        makeFeedback({
          slug: 'prusa-mk4-pla-04mm-balanced',
          outcome: 'failure',
          failureReasons: ['Stringing or oozing'],
        }),
      ]);
      const service = createProfileStatsService({ repository, registry });

      await expect(service.getProfileStats('prusa-mk4-pla-04mm-balanced')).resolves.toMatchObject({
        failureCount: 3,
        failureReasons: [
          {
            reason: 'Stringing or oozing',
            count: 4,
            percentage: 80,
          },
          {
            reason: 'Warping / lifting corners',
            count: 1,
            percentage: 20,
          },
        ],
      });
    });

    it('returns null for an unknown profile slug', async () => {
      const repository = new InMemoryFeedbackRepository([]);
      const service = createProfileStatsService({ repository, registry });

      await expect(service.getProfileStats('unknown-slug')).resolves.toBeNull();
    });
  });
});
