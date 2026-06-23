import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveManifestPath } from './manifest.js';

describe('resolveManifestPath', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('returns the generated manifest path when public/combinations.json is absent', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'printhub-manifest-'));
    const generatedDir = join(tempDir, 'generated');
    mkdirSync(generatedDir, { recursive: true });
    writeFileSync(join(generatedDir, 'combinations.json'), '{"combinations":[]}');

    expect(resolveManifestPath(tempDir)).toBe(join(tempDir, 'generated', 'combinations.json'));
  });

  it('prefers public/combinations.json when both locations exist', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'printhub-manifest-'));
    const publicDir = join(tempDir, 'public');
    const generatedDir = join(tempDir, 'generated');
    mkdirSync(publicDir, { recursive: true });
    mkdirSync(generatedDir, { recursive: true });
    writeFileSync(join(publicDir, 'combinations.json'), '{"combinations":[]}');
    writeFileSync(join(generatedDir, 'combinations.json'), '{"combinations":[]}');

    expect(resolveManifestPath(tempDir)).toBe(join(tempDir, 'public', 'combinations.json'));
  });
});
