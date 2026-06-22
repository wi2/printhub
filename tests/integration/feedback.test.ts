import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createAppServer } from '../../server/index.js';
import { createRateLimiter } from '../../server/rate-limit.js';
import { createFeedbackStore, createFileFeedbackStore } from '../../server/store.js';
import type { FeedbackSession } from '../../src/types.js';

const manifestPath = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/manifest.json');
const PROFILE_VERSION = 1;

async function postFeedback(baseUrl: string, body: unknown) {
  return fetch(`${baseUrl}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/feedback', () => {
  let server: Server;
  let baseUrl: string;
  let store: ReturnType<typeof createFeedbackStore>;

  beforeEach(async () => {
    store = createFeedbackStore();
    const rateLimiter = createRateLimiter(100, 60_000);

    server = createAppServer({ store, manifestPath, rateLimiter });

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

  it('returns 200 { ok: true } for a valid submission', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      profileVersion: PROFILE_VERSION,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns 400 when profileVersion is missing', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'profileVersion is required' });
  });

  it('returns 400 when profileVersion is invalid', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      profileVersion: 0,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'profileVersion must be a positive integer',
    });
  });

  it('persists profileVersion alongside existing feedback fields', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'printhub-feedback-integration-'));
    const filePath = join(tempDir, 'feedback.json');
    const fileStore = createFileFeedbackStore(filePath);
    const rateLimiter = createRateLimiter(100, 60_000);
    const persistenceServer = createAppServer({
      store: fileStore,
      manifestPath,
      rateLimiter,
    });

    await new Promise<void>(resolve => {
      persistenceServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = persistenceServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected server to listen on a TCP port');
    }

    const persistenceBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const response = await postFeedback(persistenceBaseUrl, {
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        profileVersion: PROFILE_VERSION,
        failureReasons: ['Stringing or oozing'],
      });

      expect(response.status).toBe(200);

      const records = JSON.parse(readFileSync(filePath, 'utf-8')) as FeedbackSession[];
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        slug: 'bambu-a1-mini-pla-04mm-balanced',
        outcome: 'failure',
        failureReasons: ['Stringing or oozing'],
        profileVersion: PROFILE_VERSION,
      });
      expect(records[0]?.submittedAt).toBeDefined();
    } finally {
      await new Promise<void>((resolve, reject) => {
        persistenceServer.close(error => (error ? reject(error) : resolve()));
      });
      rmSync(tempDir, { recursive: true });
    }
  });

  it('returns 400 when slug is missing', async () => {
    const response = await postFeedback(baseUrl, {
      outcome: 'success',
      profileVersion: PROFILE_VERSION,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'slug is required' });
  });

  it('returns 400 when outcome is not a valid value', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'maybe',
      profileVersion: PROFILE_VERSION,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'outcome must be "success", "failure", or "pending"',
    });
  });

  it('returns 400 when failureReasons is present but outcome is not failure', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      profileVersion: PROFILE_VERSION,
      failureReasons: ['Warping / lifting corners'],
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'failureReasons is only allowed when outcome is "failure"',
    });
  });

  it('returns 404 when the slug is not in the manifest', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'unknown-slug',
      outcome: 'success',
      profileVersion: PROFILE_VERSION,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Unknown profile slug' });
  });
});
