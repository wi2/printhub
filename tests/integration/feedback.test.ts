import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createAppServer } from '../../server/index.js';
import { createRateLimiter } from '../../server/rate-limit.js';
import { createFeedbackStore } from '../../server/store.js';

const manifestPath = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/manifest.json');

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

  beforeEach(async () => {
    const store = createFeedbackStore();
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
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns 400 when slug is missing', async () => {
    const response = await postFeedback(baseUrl, { outcome: 'success' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'slug is required' });
  });

  it('returns 400 when outcome is not a valid value', async () => {
    const response = await postFeedback(baseUrl, {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'maybe',
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
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Unknown profile slug' });
  });
});
