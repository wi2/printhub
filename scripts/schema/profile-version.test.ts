/**
 * Tests for profile version utilities.
 */

import { describe, it, expect } from 'vitest';
import { currentVersion, nextVersion, INITIAL_PROFILE_VERSION } from './profile-version';

describe('profile version utilities', () => {
  it('currentVersion returns the initial profile version', () => {
    expect(currentVersion()).toBe(INITIAL_PROFILE_VERSION);
    expect(currentVersion()).toBe(1);
  });

  it('nextVersion increments the given version by one', () => {
    expect(nextVersion(1)).toBe(2);
    expect(nextVersion(5)).toBe(6);
  });

  it('currentVersion is deterministic across calls', () => {
    expect(currentVersion()).toBe(currentVersion());
  });
});
