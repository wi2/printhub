import { createServer, type Server } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFeedbackHandler } from './feedback.js';
import { createManifestLookup, resolveManifestPath } from './manifest.js';
import { createRateLimiter, type RateLimiter } from './rate-limit.js';
import {
  createFileFeedbackStore,
  resolveFeedbackStorePath,
  type FeedbackStore,
} from './store.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * PrintHub runtime API server entry point.
 *
 * Feedback store: JSON file at data/feedback.json (see store.ts). Chosen over
 * SQLite or Postgres for zero dependency overhead at MVP — a single append-only
 * JSON file satisfies durable storage for launch volume. Swap createFileFeedbackStore
 * for SQLite when query volume or concurrent writes require it.
 */
export const feedbackStore = createFileFeedbackStore(
  process.env.FEEDBACK_STORE_PATH ?? resolveFeedbackStorePath(projectRoot),
);

export type AppServerOptions = {
  store?: FeedbackStore;
  manifestPath?: string;
  rateLimiter?: RateLimiter;
};

/**
 * Creates the HTTP server with injectable dependencies for integration tests.
 */
export function createAppServer(options: AppServerOptions = {}): Server {
  const store = options.store ?? feedbackStore;
  const manifest = createManifestLookup(
    options.manifestPath ?? resolveManifestPath(projectRoot),
  );
  const rateLimiter = options.rateLimiter ?? createRateLimiter(5, 60_000);
  const handleFeedback = createFeedbackHandler({ store, manifest, rateLimiter });

  return createServer(async (req, res) => {
    const url = req.url?.split('?')[0];

    if (req.method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (req.method === 'POST' && url === '/api/feedback') {
      await handleFeedback(req, res);
      return;
    }

    res.writeHead(404);
    res.end();
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 3001);
  createAppServer().listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}
