export type RateLimiter = {
  isAllowed(key: string): boolean;
};

/**
 * Sliding-window rate limiter keyed by client identifier (typically IP).
 */
export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    isAllowed(key) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter(timestamp => now - timestamp < windowMs);

      if (recent.length >= maxRequests) {
        hits.set(key, recent);
        return false;
      }

      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
