/**
 * PrintHub runtime API server entry point.
 *
 * Feedback store: in-memory array (see store.ts). Chosen over SQLite or Postgres
 * for zero operational overhead at MVP launch — records survive only for the
 * process lifetime. When persistent storage is required (e.g. post-launch stats
 * endpoint), swap createFeedbackStore() for a SQLite-backed implementation
 * without changing route handlers.
 */
import { createFeedbackStore } from './store.js';

export const feedbackStore = createFeedbackStore();
