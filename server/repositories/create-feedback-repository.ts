import type { FeedbackRepository } from './feedback-repository.js';
import {
  FileFeedbackRepository,
  resolveFeedbackStorePath,
} from './file-feedback-repository.js';
import {
  SqliteFeedbackRepository,
  resolveFeedbackSqlitePath,
} from './sqlite-feedback-repository.js';

export type FeedbackStoreKind = 'file' | 'sqlite';

/**
 * Resolves the feedback store backend from environment.
 * Defaults to the JSON file store so existing deployments are unchanged.
 */
export function resolveFeedbackStoreKind(): FeedbackStoreKind {
  const store = process.env.FEEDBACK_STORE ?? 'file';

  if (store === 'sqlite') {
    return 'sqlite';
  }

  if (store !== 'file') {
    throw new Error(`Unsupported FEEDBACK_STORE value: ${store}`);
  }

  return 'file';
}

/**
 * Creates the production feedback repository based on FEEDBACK_STORE.
 * SQLite is an implementation detail behind FeedbackRepository.
 */
export function createFeedbackRepository(projectRoot: string): FeedbackRepository {
  const feedbackStore = resolveFeedbackStoreKind();

  if (feedbackStore === 'sqlite') {
    const dbPath = process.env.FEEDBACK_SQLITE_PATH ?? resolveFeedbackSqlitePath(projectRoot);
    return new SqliteFeedbackRepository(dbPath);
  }

  const filePath = process.env.FEEDBACK_STORE_PATH ?? resolveFeedbackStorePath(projectRoot);
  return new FileFeedbackRepository(filePath);
}
