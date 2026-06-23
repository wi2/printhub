import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFeedbackRepository, resolveFeedbackStoreKind } from './create-feedback-repository.js';
import { FileFeedbackRepository } from './file-feedback-repository.js';
import { SqliteFeedbackRepository } from './sqlite-feedback-repository.js';

describe('createFeedbackRepository', () => {
  let tempDir: string;
  let previousStore: string | undefined;
  let previousFilePath: string | undefined;
  let previousSqlitePath: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'printhub-feedback-factory-'));
    previousStore = process.env.FEEDBACK_STORE;
    previousFilePath = process.env.FEEDBACK_STORE_PATH;
    previousSqlitePath = process.env.FEEDBACK_SQLITE_PATH;
  });

  afterEach(() => {
    if (previousStore === undefined) {
      delete process.env.FEEDBACK_STORE;
    } else {
      process.env.FEEDBACK_STORE = previousStore;
    }

    if (previousFilePath === undefined) {
      delete process.env.FEEDBACK_STORE_PATH;
    } else {
      process.env.FEEDBACK_STORE_PATH = previousFilePath;
    }

    if (previousSqlitePath === undefined) {
      delete process.env.FEEDBACK_SQLITE_PATH;
    } else {
      process.env.FEEDBACK_SQLITE_PATH = previousSqlitePath;
    }

    rmSync(tempDir, { recursive: true });
  });

  it('defaults to the file repository when FEEDBACK_STORE is unset', () => {
    delete process.env.FEEDBACK_STORE;
    process.env.FEEDBACK_STORE_PATH = join(tempDir, 'feedback.json');

    expect(resolveFeedbackStoreKind()).toBe('file');
    expect(createFeedbackRepository(tempDir)).toBeInstanceOf(FileFeedbackRepository);
  });

  it('creates a SQLite repository when FEEDBACK_STORE is sqlite', () => {
    process.env.FEEDBACK_STORE = 'sqlite';
    process.env.FEEDBACK_SQLITE_PATH = join(tempDir, 'feedback.db');

    expect(resolveFeedbackStoreKind()).toBe('sqlite');
    expect(createFeedbackRepository(tempDir)).toBeInstanceOf(SqliteFeedbackRepository);
  });

  it('throws for unsupported FEEDBACK_STORE values', () => {
    process.env.FEEDBACK_STORE = 'postgres';

    expect(() => resolveFeedbackStoreKind()).toThrow('Unsupported FEEDBACK_STORE value: postgres');
  });
});
