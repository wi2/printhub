import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Manifest } from '../src/types.js';

export type ManifestLookup = {
  hasSlug(slug: string): boolean;
};

/**
 * Builds a slug lookup from a combinations.json file on disk.
 */
export function createManifestLookup(manifestPath: string): ManifestLookup {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
  const slugs = new Set(manifest.combinations.map(entry => entry.slug));

  return {
    hasSlug(slug) {
      return slugs.has(slug);
    },
  };
}

/**
 * Resolves combinations.json from public/ (preferred) or generated/ (fallback).
 */
export function resolveManifestPath(projectRoot: string): string {
  const publicPath = join(projectRoot, 'public', 'combinations.json');
  if (existsSync(publicPath)) return publicPath;

  return join(projectRoot, 'generated', 'combinations.json');
}
