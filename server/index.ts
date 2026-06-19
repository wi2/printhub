import { createServer, type Server } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFeedbackHandler } from './feedback.js';
import { createManifestLookup, resolveManifestPath } from './manifest.js';
import { createRateLimiter, type RateLimiter } from './rate-limit.js';
import { createFeedbackStore, type FeedbackStore } from './store.js';

/**
 * PrintHub runtime API server entry point.
 *
 * Feedback store: in-memory array (see store.ts). Chosen over SQLite or Postgres
 * for zero operational overhead at MVP launch — records survive only for the
 * process lifetime. When persistent storage is required (e.g. post-launch stats
 * endpoint), swap createFeedbackStore() for a SQLite-backed implementation
 * without changing route handlers.
 */
export const feedbackStore = createFeedbackStore();

export type AppServerOptions = {
  store?: FeedbackStore;
  manifestPath?: string;
  rateLimiter?: RateLimiter;
};

/**
 * Creates the HTTP server with injectable dependencies for integration tests.
 */
export function createAppServer(options: AppServerOptions = {}): Server {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const store = options.store ?? feedbackStore;
  const manifest = createManifestLookup(
    options.manifestPath ?? resolveManifestPath(projectRoot),
  );
  const rateLimiter = options.rateLimiter ?? createRateLimiter(5, 60_000);
  const handleFeedback = createFeedbackHandler({ store, manifest, rateLimiter });

  return createServer(async (req, res) => {
    const url = req.url?.split('?')[0];

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
