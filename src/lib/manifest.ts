import type { Manifest, ManifestEntry } from '../types';

let manifestCache: Manifest | undefined = undefined;

/**
 * Loads combinations.json once per page session and caches the result at module scope.
 * Throws when the network request fails or the response is not OK.
 */
export async function loadManifest(): Promise<Manifest> {
  if (!manifestCache) {
    const response = await fetch('/combinations.json');
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    manifestCache = (await response.json()) as Manifest;
  }
  return manifestCache;
}

/**
 * Finds a manifest entry by its canonical slug, or undefined when no match exists.
 */
export function findManifestEntryBySlug(
  slug: string,
  manifest: Manifest,
): ManifestEntry | undefined {
  return manifest.combinations.find(entry => entry.slug === slug);
}

/**
 * Resets the module-level manifest cache.
 * Call this in afterEach when testing to prevent cache bleed between tests.
 */
export function _resetManifestCache(): void {
  manifestCache = undefined;
}
