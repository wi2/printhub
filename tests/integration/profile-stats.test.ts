import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createAppServer } from '../../server/index.js';
import { createRateLimiter } from '../../server/rate-limit.js';
import type { FeedbackRepository } from '../../server/repositories/feedback-repository.js';
import type { FeedbackSession } from '../../src/types.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const manifestPath = join(fixturesDir, 'manifest.json');
const profileVersionRegistryPath = join(fixturesDir, 'profile-versions.json');

class TestFeedbackRepository implements FeedbackRepository {
  constructor(private readonly records: FeedbackSession[] = []) {}

  async save(feedback: FeedbackSession): Promise<void> {
    this.records.push({ ...feedback, failureReasons: [...feedback.failureReasons] });
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

async function getProfileStats(baseUrl: string, slug: string) {
  return fetch(`${baseUrl}/api/profiles/${encodeURIComponent(slug)}/stats`);
}

describe('GET /api/profiles/:slug/stats', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const repository = new TestFeedbackRepository([
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'success',
        failureReasons: [],
        profileVersion: 2,
        submittedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        failureReasons: ['Stringing or oozing'],
        profileVersion: 1,
        submittedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
    const rateLimiter = createRateLimiter(100, 60_000);

    server = createAppServer({
      repository,
      manifestPath,
      profileVersionRegistryPath,
      rateLimiter,
    });

    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected server to listen on a TCP port');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  });

  it('returns 200 with profile statistics for a known slug', async () => {
    const response = await getProfileStats(baseUrl, 'bambu-a1-mini-pla-04mm-balanced');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      currentVersion: 2,
      totalFeedback: 2,
      successCount: 1,
      failureCount: 1,
      successRate: 50,
      failureReasons: [
        {
          reason: 'Stringing or oozing',
          count: 1,
          percentage: 100,
        },
      ],
    });
  });

  it('returns 404 when the slug is not in the profile version registry', async () => {
    const response = await getProfileStats(baseUrl, 'unknown-slug');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('returns zeroed stats when a known profile has no feedback', async () => {
    const repository = new TestFeedbackRepository([]);
    const rateLimiter = createRateLimiter(100, 60_000);
    const emptyServer = createAppServer({
      repository,
      manifestPath,
      profileVersionRegistryPath,
      rateLimiter,
    });

    await new Promise<void>(resolve => {
      emptyServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = emptyServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected server to listen on a TCP port');
    }

    const emptyBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const response = await getProfileStats(emptyBaseUrl, 'prusa-mk4-pla-04mm-balanced');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        slug: 'prusa-mk4-pla-04mm-balanced',
        currentVersion: 1,
        totalFeedback: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        failureReasons: [],
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        emptyServer.close(error => (error ? reject(error) : resolve()));
      });
    }
  });

  it('reads currentVersion from the profile version registry', async () => {
    const response = await getProfileStats(baseUrl, 'bambu-a1-mini-pla-04mm-balanced');
    const body = (await response.json()) as { currentVersion: number };

    expect(response.status).toBe(200);
    expect(body.currentVersion).toBe(2);
  });
});
