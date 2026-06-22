import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FeedbackStore } from './store.js';
import type { ManifestLookup } from './manifest.js';
import type { RateLimiter } from './rate-limit.js';
import { validateFeedbackInput } from './validate-input.js';

export type FeedbackHandlerDeps = {
  store: FeedbackStore;
  manifest: ManifestLookup;
  rateLimiter: RateLimiter;
};

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }

  const text = Buffer.concat(chunks).toString('utf-8');
  if (!text) return {};

  return JSON.parse(text) as unknown;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  return req.socket.remoteAddress ?? 'unknown';
}

/**
 * Handles POST /api/feedback — validates input, checks manifest, stores feedback.
 */
export function createFeedbackHandler(deps: FeedbackHandlerDeps) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (!deps.rateLimiter.isAllowed(getClientIp(req))) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    let body: unknown;

    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const validated = validateFeedbackInput(body);

    if ('status' in validated) {
      res.writeHead(validated.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: validated.message }));
      return;
    }

    if (!deps.manifest.hasSlug(validated.slug)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown profile slug' }));
      return;
    }

    deps.store.insert({
      slug: validated.slug,
      outcome: validated.outcome,
      failureReasons: validated.failureReasons ?? [],
      profileVersion: validated.profileVersion,
      submittedAt: new Date().toISOString(),
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  };
}
