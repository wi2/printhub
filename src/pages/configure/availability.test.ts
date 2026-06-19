import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../lib/msw/server';
import {
  isAvailable,
  isMaterialAvailable,
  isNozzleAvailable,
  _resetManifestCache,
} from './availability';

// Minimal manifest used across tests
const TEST_MANIFEST = {
  combinations: [
    {
      slug: 'bambu-a1-mini-pla-0.4-balanced',
      printer: 'bambu-a1-mini',
      material: 'pla',
      nozzle: '0.4',
      goal: 'balanced',
      isAvailable: true,
      slicerFormat: 'bambu-orca',
      downloadPath: '/profiles/bambu-orca/bambu-a1-mini-pla-0.4-balanced.3mf',
      highlights: ['h1', 'h2', 'h3'],
    },
    {
      slug: 'bambu-a1-mini-petg-0.4-balanced',
      printer: 'bambu-a1-mini',
      material: 'petg',
      nozzle: '0.4',
      goal: 'balanced',
      isAvailable: true,
      slicerFormat: 'bambu-orca',
      downloadPath: '/profiles/bambu-orca/bambu-a1-mini-petg-0.4-balanced.3mf',
      highlights: ['h1', 'h2', 'h3'],
    },
    // Deliberately omitted: TPU for bambu-a1-mini, 0.6mm PLA for bambu-a1-mini
  ],
};

function mockManifest() {
  server.use(
    http.get('/combinations.json', () => HttpResponse.json(TEST_MANIFEST)),
  );
}

afterEach(() => {
  _resetManifestCache();
});

describe('isAvailable', () => {
  it('returns true when an exact matching combination exists and isAvailable is true', async () => {
    mockManifest();
    await expect(
      isAvailable('bambu-a1-mini', 'pla', '0.4', 'balanced'),
    ).resolves.toBe(true);
  });

  it('returns false when the exact combination does not exist in the manifest', async () => {
    mockManifest();
    await expect(
      isAvailable('bambu-a1-mini', 'tpu', '0.4', 'balanced'),
    ).resolves.toBe(false);
  });

  it('returns false when nozzle does not match', async () => {
    mockManifest();
    await expect(
      isAvailable('bambu-a1-mini', 'pla', '0.6', 'balanced'),
    ).resolves.toBe(false);
  });
});

describe('isMaterialAvailable', () => {
  it('returns true when at least one profile exists for printer + material', async () => {
    mockManifest();
    await expect(isMaterialAvailable('bambu-a1-mini', 'pla')).resolves.toBe(true);
  });

  it('returns false when no profile exists for printer + material', async () => {
    mockManifest();
    await expect(isMaterialAvailable('bambu-a1-mini', 'tpu')).resolves.toBe(false);
  });

  it('returns false for a printer that has no combinations at all', async () => {
    mockManifest();
    await expect(isMaterialAvailable('prusa-mk4', 'pla')).resolves.toBe(false);
  });
});

describe('isNozzleAvailable', () => {
  it('returns true when at least one profile exists for printer + material + nozzle', async () => {
    mockManifest();
    await expect(isNozzleAvailable('bambu-a1-mini', 'pla', '0.4')).resolves.toBe(true);
  });

  it('returns false when no profile exists for printer + material + nozzle', async () => {
    mockManifest();
    await expect(isNozzleAvailable('bambu-a1-mini', 'pla', '0.6')).resolves.toBe(false);
  });
});

describe('manifest caching', () => {
  it('fetches the manifest only once across multiple calls', async () => {
    let fetchCount = 0;
    server.use(
      http.get('/combinations.json', () => {
        fetchCount++;
        return HttpResponse.json(TEST_MANIFEST);
      }),
    );

    await isAvailable('bambu-a1-mini', 'pla', '0.4', 'balanced');
    await isAvailable('bambu-a1-mini', 'petg', '0.4', 'balanced');
    await isMaterialAvailable('bambu-a1-mini', 'pla');

    expect(fetchCount).toBe(1);
  });
});
