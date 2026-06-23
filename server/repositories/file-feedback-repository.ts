import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FeedbackSession } from '../../src/types.js';
import type { FeedbackRepository } from './feedback-repository.js';

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
    profileVersion: record.profileVersion,
    submittedAt: record.submittedAt,
  };
}

/**
 * JSON file-backed feedback repository. Records survive server restarts.
 * The only component allowed to read/write the feedback storage file.
 */
export class FileFeedbackRepository implements FeedbackRepository {
  private records: FeedbackSession[];

  constructor(private readonly filePath: string) {
    this.records = loadRecords(filePath);
  }

  async save(feedback: FeedbackSession): Promise<void> {
    this.records.push(cloneRecord(feedback));
    saveRecords(this.filePath, this.records);
  }

  async findAll(): Promise<FeedbackSession[]> {
    return this.records.map(cloneRecord);
  }

  async findBySlug(slug: string): Promise<FeedbackSession[]> {
    return this.records.filter(record => record.slug === slug).map(cloneRecord);
  }

  async findBySlugAndVersion(
    slug: string,
    profileVersion: number,
  ): Promise<FeedbackSession[]> {
    return this.records
      .filter(
        record => record.slug === slug && record.profileVersion === profileVersion,
      )
      .map(cloneRecord);
  }
}

export function resolveFeedbackStorePath(projectRoot: string): string {
  return `${projectRoot}/data/feedback.json`;
}
