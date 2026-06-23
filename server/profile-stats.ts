import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ProfileStatsService } from './services/profile-stats.js';

export type ProfileStatsHandlerDeps = {
  statsService: ProfileStatsService;
};

/**
 * Handles GET /api/profiles/:slug/stats — returns profile-level analytics.
 * Statistics are informational only and do not modify profile versions.
 */
export function createProfileStatsHandler(deps: ProfileStatsHandlerDeps) {
  return async (slug: string, res: ServerResponse, _req: IncomingMessage) => {
    const stats = await deps.statsService.getProfileStats(slug);

    if (!stats) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Profile not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  };
}

/**
 * Matches GET /api/profiles/:slug/stats and returns the decoded slug segment.
 */
export function parseProfileStatsPath(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const match = /^\/api\/profiles\/([^/]+)\/stats$/.exec(url);
  if (!match?.[1]) {
    return undefined;
  }

  return decodeURIComponent(match[1]);
}
