import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server';
import { loadProfileVersion } from './profile-version';

describe('loadProfileVersion', () => {
  it('returns metadata.version from the canonical profile artifact', async () => {
    server.use(
      http.get('/profiles/bambu-a1-mini-pla-04mm-balanced.json', () =>
        HttpResponse.json({ metadata: { version: 1 } }),
      ),
    );

    await expect(loadProfileVersion('bambu-a1-mini-pla-04mm-balanced')).resolves.toBe(1);
  });

  it('throws when the profile request fails', async () => {
    server.use(
      http.get('/profiles/missing-slug.json', () => new HttpResponse(null, { status: 404 })),
    );

    await expect(loadProfileVersion('missing-slug')).rejects.toThrow(
      'Failed to load profile version: 404',
    );
  });

  it('throws when metadata.version is invalid', async () => {
    server.use(
      http.get('/profiles/invalid-version.json', () =>
        HttpResponse.json({ metadata: { version: 0 } }),
      ),
    );

    await expect(loadProfileVersion('invalid-version')).rejects.toThrow(
      'Invalid profile version in canonical profile',
    );
  });
});
