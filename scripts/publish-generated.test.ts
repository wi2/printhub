import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { publishGeneratedToPublic } from './publish-generated';

describe('publishGeneratedToPublic', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'printhub-publish-'));
    mkdirSync(join(root, 'generated', 'profiles', 'prusaslicer'), { recursive: true });
    writeFileSync(join(root, 'generated', 'combinations.json'), '{"combinations":[]}');
    writeFileSync(join(root, 'generated', 'profiles', 'prusaslicer', 'test.ini'), 'ini-content');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies combinations.json and profile files into public/', () => {
    publishGeneratedToPublic(root);

    expect(readFileSync(join(root, 'public', 'combinations.json'), 'utf-8')).toBe(
      '{"combinations":[]}',
    );
    expect(
      readFileSync(join(root, 'public', 'profiles', 'prusaslicer', 'test.ini'), 'utf-8'),
    ).toBe('ini-content');
  });

  it('throws when generated/combinations.json is missing', () => {
    rmSync(join(root, 'generated', 'combinations.json'));

    expect(() => publishGeneratedToPublic(root)).toThrow(/combinations\.json not found/);
  });

  it('replaces an existing public/profiles directory on subsequent publishes', () => {
    publishGeneratedToPublic(root);
    writeFileSync(join(root, 'generated', 'profiles', 'prusaslicer', 'test.ini'), 'updated');

    publishGeneratedToPublic(root);

    expect(
      readFileSync(join(root, 'public', 'profiles', 'prusaslicer', 'test.ini'), 'utf-8'),
    ).toBe('updated');
    expect(existsSync(join(root, 'public', 'profiles', 'prusaslicer', 'test.ini'))).toBe(true);
  });
});
