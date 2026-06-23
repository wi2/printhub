import { createServer, type Server } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFeedbackHandler } from './feedback.js';
import { createManifestLookup, resolveManifestPath } from './manifest.js';
import {
  createProfileVersionRegistryLookup,
  resolveProfileVersionRegistryPath,
} from './profile-version-registry.js';
import { createProfileStatsHandler, parseProfileStatsPath } from './profile-stats.js';
import { createRateLimiter, type RateLimiter } from './rate-limit.js';
import { createFeedbackRepository } from './repositories/create-feedback-repository.js';
import type { FeedbackRepository } from './repositories/feedback-repository.js';
import { createProfileStatsService } from './services/profile-stats.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * PrintHub runtime API server entry point.
 *
 * Feedback persistence is selected via FEEDBACK_STORE (file | sqlite; default file).
 * SQLite is an implementation detail behind FeedbackRepository — handlers depend
 * on the interface only. Set FEEDBACK_STORE=sqlite to use data/feedback.db.
 */
export const feedbackRepository = createFeedbackRepository(projectRoot);

export type AppServerOptions = {
  repository?: FeedbackRepository;
  manifestPath?: string;
  profileVersionRegistryPath?: string;
  rateLimiter?: RateLimiter;
};

/**
 * Creates the HTTP server with injectable dependencies for integration tests.
 */
export function createAppServer(options: AppServerOptions = {}): Server {
  const repository = options.repository ?? feedbackRepository;
  const manifest = createManifestLookup(
    options.manifestPath ?? resolveManifestPath(projectRoot),
  );
  const rateLimiter = options.rateLimiter ?? createRateLimiter(5, 60_000);
  const handleFeedback = createFeedbackHandler({ repository, manifest, rateLimiter });
  const registry = createProfileVersionRegistryLookup(
    options.profileVersionRegistryPath ?? resolveProfileVersionRegistryPath(projectRoot),
  );
  const statsService = createProfileStatsService({ repository, registry });
  const handleProfileStats = createProfileStatsHandler({ statsService });

  return createServer(async (req, res) => {
    const url = req.url?.split('?')[0];

    if (req.method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    const statsSlug = parseProfileStatsPath(url);
    if (req.method === 'GET' && statsSlug) {
      await handleProfileStats(statsSlug, res, req);
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
