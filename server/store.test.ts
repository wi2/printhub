import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import type { FeedbackSession } from '../src/types.js';
import { createFeedbackStore, createFileFeedbackStore } from './store.js';

describe('createFeedbackStore', () => {
  const store = createFeedbackStore();

  beforeEach(() => {
    store.clear();
  });

  it('records slug, outcome, failureReasons, profileVersion, and submittedAt', () => {
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'failure',
      failureReasons: ['Stringing or oozing'],
      profileVersion: 1,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(store.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(0);
  });

  it('returns the count of successful outcomes for a slug', () => {
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-02T00:00:00.000Z',
    });
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'pending',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-03T00:00:00.000Z',
    });
    store.insert({
      slug: 'prusa-mk4-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(store.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(2);
    expect(store.countSuccessBySlug('prusa-mk4-pla-04mm-balanced')).toBe(1);
    expect(store.countSuccessBySlug('unknown-slug')).toBe(0);
  });

  it('returns an isolated instance per createFeedbackStore call', () => {
    const otherStore = createFeedbackStore();

    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(otherStore.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(0);
  });
});

describe('createFileFeedbackStore', () => {
  let tempDir: string;
  let filePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'printhub-feedback-'));
    filePath = join(tempDir, 'feedback.json');
  });

  it('persists records across store instances', () => {
    const firstStore = createFileFeedbackStore(filePath);
    firstStore.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 1,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    const secondStore = createFileFeedbackStore(filePath);
    expect(secondStore.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(1);

    rmSync(tempDir, { recursive: true });
  });

  it('persists profileVersion in the JSON file', () => {
    const fileStore = createFileFeedbackStore(filePath);
    fileStore.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      profileVersion: 2,
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    const records = JSON.parse(readFileSync(filePath, 'utf-8')) as FeedbackSession[];
    expect(records[0]?.profileVersion).toBe(2);

    rmSync(tempDir, { recursive: true });
  });
});
