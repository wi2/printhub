import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createAppServer } from '../../server/index.js';
import { createRateLimiter } from '../../server/rate-limit.js';
import type { FeedbackRepository } from '../../server/repositories/feedback-repository.js';
import type { FeedbackSession } from '../../src/types.js';

const manifestPath = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/manifest.json');

class EmptyFeedbackRepository implements FeedbackRepository {
  async save(_feedback: FeedbackSession): Promise<void> {}

  async findAll(): Promise<FeedbackSession[]> {
    return [];
  }

  async findBySlug(_slug: string): Promise<FeedbackSession[]> {
    return [];
  }

  async findBySlugAndVersion(
    _slug: string,
    _profileVersion: number,
  ): Promise<FeedbackSession[]> {
    return [];
  }
}

describe('server routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    server = createAppServer({
      repository: new EmptyFeedbackRepository(),
      manifestPath,
      rateLimiter: createRateLimiter(100, 60_000),
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

  it('returns 200 with ok for GET /health', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);

    expect(response.status).toBe(404);
  });
});
