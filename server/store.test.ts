import { describe, it, expect, beforeEach } from 'vitest';
import { createFeedbackStore } from './store.js';

describe('createFeedbackStore', () => {
  const store = createFeedbackStore();

  beforeEach(() => {
    store.clear();
  });

  it('records slug, outcome, failureReasons, and submittedAt', () => {
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'failure',
      failureReasons: ['Stringing or oozing'],
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(store.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(0);
  });

  it('returns the count of successful outcomes for a slug', () => {
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      submittedAt: '2026-01-01T00:00:00.000Z',
    });
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
      submittedAt: '2026-01-02T00:00:00.000Z',
    });
    store.insert({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'pending',
      failureReasons: [],
      submittedAt: '2026-01-03T00:00:00.000Z',
    });
    store.insert({
      slug: 'prusa-mk4-pla-04mm-balanced',
      outcome: 'success',
      failureReasons: [],
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
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(otherStore.countSuccessBySlug('bambu-a1-mini-pla-04mm-balanced')).toBe(0);
  });
});
