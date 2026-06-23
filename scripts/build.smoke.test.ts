import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from './build.js';

/**
 * Smoke test for the profile build entry point.
 * Sub-module behavior is covered by engine, schema, and serializer unit tests.
 */
describe('scripts/build.ts smoke', () => {
  it('completes and writes the manifest, profile JSON, and version registry', () => {
    run();

    const manifestPath = join(process.cwd(), 'generated/combinations.json');
    const registryPath = join(process.cwd(), 'generated/profile-versions/index.json');

    expect(existsSync(manifestPath)).toBe(true);
    expect(existsSync(registryPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      combinations: { slug: string }[];
    };

    expect(manifest.combinations.length).toBeGreaterThan(0);

    const firstSlug = manifest.combinations[0]?.slug;
    expect(firstSlug).toBeDefined();
    expect(existsSync(join(process.cwd(), `generated/profiles/${firstSlug}.json`))).toBe(true);
  });
});
