import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server';
import { loadManifest, findManifestEntryBySlug, _resetManifestCache } from './manifest';
import type { Manifest } from '../types';

const TEST_MANIFEST: Manifest = {
  combinations: [
    {
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      printer: 'bambu-a1-mini',
      material: 'pla',
      nozzle: '0.4',
      goal: 'balanced',
      isAvailable: true,
      slicerFormat: 'bambu-orca',
      downloadPath: '/profiles/bambu-a1-mini-pla-04mm-balanced.3mf',
      highlights: ['h1', 'h2', 'h3'],
    },
  ],
};

afterEach(() => {
  _resetManifestCache();
});

describe('loadManifest', () => {
  it('returns parsed manifest data from combinations.json', async () => {
    server.use(
      http.get('/combinations.json', () => HttpResponse.json(TEST_MANIFEST)),
    );

    await expect(loadManifest()).resolves.toEqual(TEST_MANIFEST);
  });

  it('fetches the manifest only once across multiple calls', async () => {
    let fetchCount = 0;
    server.use(
      http.get('/combinations.json', () => {
        fetchCount++;
        return HttpResponse.json(TEST_MANIFEST);
      }),
    );

    await loadManifest();
    await loadManifest();

    expect(fetchCount).toBe(1);
  });

  it('throws when the manifest request fails', async () => {
    server.use(http.get('/combinations.json', () => HttpResponse.error()));

    await expect(loadManifest()).rejects.toThrow();
  });
});

describe('findManifestEntryBySlug', () => {
  it('returns the matching entry when the slug exists', () => {
    expect(
      findManifestEntryBySlug('bambu-a1-mini-pla-04mm-balanced', TEST_MANIFEST),
    ).toEqual(TEST_MANIFEST.combinations[0]);
  });

  it('returns undefined when the slug is not in the manifest', () => {
    expect(findManifestEntryBySlug('unknown-slug', TEST_MANIFEST)).toBeUndefined();
  });
});
