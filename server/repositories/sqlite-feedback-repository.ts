import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import type { FeedbackOutcome, FeedbackSession } from '../../src/types.js';
import type { FeedbackRepository } from './feedback-repository.js';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  profile_version INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  failure_reasons TEXT NOT NULL,
  submitted_at TEXT NOT NULL
)
`;

type FeedbackRow = {
  slug: string;
  profile_version: number;
  outcome: string;
  failure_reasons: string;
  submitted_at: string;
};

function cloneRecord(record: FeedbackSession): FeedbackSession {
  return {
    slug: record.slug,
    outcome: record.outcome,
    failureReasons: [...record.failureReasons],
    profileVersion: record.profileVersion,
    submittedAt: record.submittedAt,
  };
}

function rowToSession(row: FeedbackRow): FeedbackSession {
  return {
    slug: row.slug,
    outcome: row.outcome as FeedbackOutcome,
    failureReasons: JSON.parse(row.failure_reasons) as string[],
    profileVersion: row.profile_version,
    submittedAt: row.submitted_at,
  };
}

/**
 * SQLite-backed feedback repository. Creates the database and schema on first use.
 * The only component allowed to read/write the feedback SQLite database.
 */
export class SqliteFeedbackRepository implements FeedbackRepository {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(CREATE_TABLE_SQL);
  }

  async save(feedback: FeedbackSession): Promise<void> {
    const record = cloneRecord(feedback);

    this.db
      .prepare(
        `INSERT INTO feedback (slug, profile_version, outcome, failure_reasons, submitted_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        record.slug,
        record.profileVersion,
        record.outcome,
        JSON.stringify(record.failureReasons),
        record.submittedAt,
      );
  }

  async findAll(): Promise<FeedbackSession[]> {
    const rows = this.db
      .prepare(
        `SELECT slug, profile_version, outcome, failure_reasons, submitted_at
         FROM feedback
         ORDER BY id ASC`,
      )
      .all() as FeedbackRow[];

    return rows.map(row => cloneRecord(rowToSession(row)));
  }

  async findBySlug(slug: string): Promise<FeedbackSession[]> {
    const rows = this.db
      .prepare(
        `SELECT slug, profile_version, outcome, failure_reasons, submitted_at
         FROM feedback
         WHERE slug = ?
         ORDER BY id ASC`,
      )
      .all(slug) as FeedbackRow[];

    return rows.map(row => cloneRecord(rowToSession(row)));
  }

  async findBySlugAndVersion(
    slug: string,
    profileVersion: number,
  ): Promise<FeedbackSession[]> {
    const rows = this.db
      .prepare(
        `SELECT slug, profile_version, outcome, failure_reasons, submitted_at
         FROM feedback
         WHERE slug = ? AND profile_version = ?
         ORDER BY id ASC`,
      )
      .all(slug, profileVersion) as FeedbackRow[];

    return rows.map(row => cloneRecord(rowToSession(row)));
  }
}

export function resolveFeedbackSqlitePath(projectRoot: string): string {
  return `${projectRoot}/data/feedback.db`;
}

/**
 * Stable identity for a feedback record used by the migration utility.
 * Matches on all persisted fields so reruns skip already-imported rows.
 */
export function feedbackRecordKey(record: FeedbackSession): string {
  return [
    record.slug,
    record.profileVersion,
    record.outcome,
    record.submittedAt,
    JSON.stringify(record.failureReasons),
  ].join('|');
}
