import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FileFeedbackRepository,
  resolveFeedbackStorePath,
} from '../server/repositories/file-feedback-repository.js';
import {
  SqliteFeedbackRepository,
  feedbackRecordKey,
  resolveFeedbackSqlitePath,
} from '../server/repositories/sqlite-feedback-repository.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * One-way migration from the JSON file store to SQLite.
 * Idempotent — safe to rerun; skips records already present in SQLite.
 */
async function migrateFeedbackToSqlite(): Promise<void> {
  const filePath = process.env.FEEDBACK_STORE_PATH ?? resolveFeedbackStorePath(projectRoot);
  const dbPath = process.env.FEEDBACK_SQLITE_PATH ?? resolveFeedbackSqlitePath(projectRoot);

  const fileRepository = new FileFeedbackRepository(filePath);
  const sqliteRepository = new SqliteFeedbackRepository(dbPath);

  const fileRecords = await fileRepository.findAll();
  const sqliteRecords = await sqliteRepository.findAll();
  const existingKeys = new Set(sqliteRecords.map(feedbackRecordKey));

  let migrated = 0;
  let skipped = 0;

  for (const record of fileRecords) {
    const key = feedbackRecordKey(record);

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    await sqliteRepository.save(record);
    existingKeys.add(key);
    migrated += 1;
  }

  console.log(
    `Migration complete: ${migrated} migrated, ${skipped} skipped, ${fileRecords.length} total in file store`,
  );
  console.log(`SQLite database: ${dbPath}`);
}

migrateFeedbackToSqlite().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
