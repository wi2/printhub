import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { FeedbackSession } from '../../src/types.js';
import { SqliteFeedbackRepository } from './sqlite-feedback-repository.js';

function makeFeedback(
  overrides: Partial<FeedbackSession> = {},
): FeedbackSession {
  return {
    slug: 'bambu-a1-mini-pla-04mm-balanced',
    outcome: 'success',
    failureReasons: [],
    profileVersion: 1,
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('SqliteFeedbackRepository', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'printhub-feedback-sqlite-'));
    dbPath = join(tempDir, 'feedback.db');
  });

  it('creates the database file when it does not exist', async () => {
    expect(existsSync(dbPath)).toBe(false);

    const repository = new SqliteFeedbackRepository(dbPath);

    expect(existsSync(dbPath)).toBe(true);
    await expect(repository.findAll()).resolves.toEqual([]);

    rmSync(tempDir, { recursive: true });
  });

  it('returns an empty array from findAll when the database is new', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);

    await expect(repository.findAll()).resolves.toEqual([]);
    await expect(repository.findBySlug('unknown-slug')).resolves.toEqual([]);
    await expect(repository.findBySlugAndVersion('unknown-slug', 1)).resolves.toEqual([]);

    rmSync(tempDir, { recursive: true });
  });

  it('persists a saved record to SQLite', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);
    const feedback = makeFeedback({ profileVersion: 2 });

    await repository.save(feedback);

    await expect(repository.findAll()).resolves.toEqual([feedback]);

    rmSync(tempDir, { recursive: true });
  });

  it('returns all saved records from findAll', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);
    const first = makeFeedback({ submittedAt: '2026-01-01T00:00:00.000Z' });
    const second = makeFeedback({
      slug: 'prusa-mk4-pla-04mm-balanced',
      outcome: 'failure',
      failureReasons: ['Stringing or oozing'],
      submittedAt: '2026-01-02T00:00:00.000Z',
    });

    await repository.save(first);
    await repository.save(second);

    await expect(repository.findAll()).resolves.toEqual([first, second]);

    rmSync(tempDir, { recursive: true });
  });

  it('returns only records for the requested slug from findBySlug', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);
    const matching = makeFeedback();
    const otherSlug = makeFeedback({
      slug: 'prusa-mk4-pla-04mm-balanced',
      submittedAt: '2026-01-02T00:00:00.000Z',
    });

    await repository.save(matching);
    await repository.save(otherSlug);

    await expect(repository.findBySlug('bambu-a1-mini-pla-04mm-balanced')).resolves.toEqual([
      matching,
    ]);

    rmSync(tempDir, { recursive: true });
  });

  it('returns only records matching slug and profileVersion from findBySlugAndVersion', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);
    const versionOne = makeFeedback({ profileVersion: 1 });
    const versionTwo = makeFeedback({
      profileVersion: 2,
      submittedAt: '2026-01-02T00:00:00.000Z',
    });
    const otherSlug = makeFeedback({
      slug: 'prusa-mk4-pla-04mm-balanced',
      profileVersion: 1,
      submittedAt: '2026-01-03T00:00:00.000Z',
    });

    await repository.save(versionOne);
    await repository.save(versionTwo);
    await repository.save(otherSlug);

    await expect(
      repository.findBySlugAndVersion('bambu-a1-mini-pla-04mm-balanced', 1),
    ).resolves.toEqual([versionOne]);
    await expect(
      repository.findBySlugAndVersion('bambu-a1-mini-pla-04mm-balanced', 2),
    ).resolves.toEqual([versionTwo]);

    rmSync(tempDir, { recursive: true });
  });

  it('loads existing records when a new repository instance is created', async () => {
    const firstRepository = new SqliteFeedbackRepository(dbPath);
    const feedback = makeFeedback();

    await firstRepository.save(feedback);

    const secondRepository = new SqliteFeedbackRepository(dbPath);
    await expect(secondRepository.findAll()).resolves.toEqual([feedback]);

    rmSync(tempDir, { recursive: true });
  });

  it('returns defensive copies so callers cannot mutate stored records', async () => {
    const repository = new SqliteFeedbackRepository(dbPath);
    const feedback = makeFeedback({ failureReasons: ['Warping / lifting corners'] });

    await repository.save(feedback);

    const [loaded] = await repository.findAll();
    loaded!.failureReasons.push('Stringing or oozing');

    await expect(repository.findAll()).resolves.toEqual([feedback]);

    rmSync(tempDir, { recursive: true });
  });
});
