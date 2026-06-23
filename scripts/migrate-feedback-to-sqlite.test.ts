import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FeedbackSession } from '../src/types.js';
import { FileFeedbackRepository } from '../server/repositories/file-feedback-repository.js';
import {
  SqliteFeedbackRepository,
  feedbackRecordKey,
} from '../server/repositories/sqlite-feedback-repository.js';

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

describe('migrate-feedback-to-sqlite', () => {
  it('imports file records into SQLite and skips duplicates on rerun', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'printhub-feedback-migrate-'));
    const filePath = join(tempDir, 'feedback.json');
    const dbPath = join(tempDir, 'feedback.db');

    const fileRepository = new FileFeedbackRepository(filePath);
    const sqliteRepository = new SqliteFeedbackRepository(dbPath);
    const first = makeFeedback();
    const second = makeFeedback({
      slug: 'prusa-mk4-pla-04mm-balanced',
      outcome: 'failure',
      failureReasons: ['Stringing or oozing'],
      submittedAt: '2026-01-02T00:00:00.000Z',
    });

    await fileRepository.save(first);
    await fileRepository.save(second);

    async function migrateOnce(): Promise<{ migrated: number; skipped: number }> {
      const source = new FileFeedbackRepository(filePath);
      const target = new SqliteFeedbackRepository(dbPath);
      const fileRecords = await source.findAll();
      const sqliteRecords = await target.findAll();
      const existingKeys = new Set(sqliteRecords.map(feedbackRecordKey));

      let migrated = 0;
      let skipped = 0;

      for (const record of fileRecords) {
        const key = feedbackRecordKey(record);

        if (existingKeys.has(key)) {
          skipped += 1;
          continue;
        }

        await target.save(record);
        existingKeys.add(key);
        migrated += 1;
      }

      return { migrated, skipped };
    }

    try {
      await expect(migrateOnce()).resolves.toEqual({ migrated: 2, skipped: 0 });
      await expect(sqliteRepository.findAll()).resolves.toEqual([first, second]);
      await expect(migrateOnce()).resolves.toEqual({ migrated: 0, skipped: 2 });
      await expect(sqliteRepository.findAll()).resolves.toEqual([first, second]);
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });
});
