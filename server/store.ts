import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FeedbackSession } from '../src/types.js';

export type FeedbackStore = {
  insert(record: FeedbackSession): void;
  countSuccessBySlug(slug: string): number;
  clear(): void;
};

function loadRecords(filePath: string): FeedbackSession[] {
  if (!existsSync(filePath)) return [];

  const text = readFileSync(filePath, 'utf-8');
  if (!text.trim()) return [];

  return JSON.parse(text) as FeedbackSession[];
}

function saveRecords(filePath: string, records: FeedbackSession[]): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');
}

function cloneRecord(record: FeedbackSession): FeedbackSession {
  return {
    slug: record.slug,
    outcome: record.outcome,
    failureReasons: [...record.failureReasons],
    submittedAt: record.submittedAt,
  };
}

/**
 * Creates an in-memory feedback store. Each call returns an isolated instance
 * suitable for tests.
 */
export function createFeedbackStore(): FeedbackStore {
  const records: FeedbackSession[] = [];

  return {
    insert(record) {
      records.push(cloneRecord(record));
    },

    countSuccessBySlug(slug) {
      return records.filter(
        record => record.slug === slug && record.outcome === 'success',
      ).length;
    },

    clear() {
      records.length = 0;
    },
  };
}

/**
 * Creates a JSON file-backed feedback store. Records survive server restarts.
 */
export function createFileFeedbackStore(filePath: string): FeedbackStore {
  let records = loadRecords(filePath);

  return {
    insert(record) {
      records.push(cloneRecord(record));
      saveRecords(filePath, records);
    },

    countSuccessBySlug(slug) {
      return records.filter(
        record => record.slug === slug && record.outcome === 'success',
      ).length;
    },

    clear() {
      records = [];
      saveRecords(filePath, records);
    },
  };
}

export function resolveFeedbackStorePath(projectRoot: string): string {
  return `${projectRoot}/data/feedback.json`;
}
