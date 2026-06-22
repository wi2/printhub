import { describe, expect, it } from 'vitest';
import { validateFeedbackInput } from './validate-input.js';

describe('validateFeedbackInput', () => {
  const validBody = {
    slug: 'bambu-a1-mini-pla-04mm-balanced',
    outcome: 'success',
    profileVersion: 1,
  };

  it('returns a typed request for valid input', () => {
    expect(validateFeedbackInput(validBody)).toEqual(validBody);
  });

  it('returns 400 when profileVersion is missing', () => {
    const result = validateFeedbackInput({
      slug: 'bambu-a1-mini-pla-04mm-balanced',
      outcome: 'success',
    });

    expect(result).toEqual({ status: 400, message: 'profileVersion is required' });
  });

  it('returns 400 when profileVersion is not a positive integer', () => {
    expect(
      validateFeedbackInput({ ...validBody, profileVersion: 0 }),
    ).toEqual({ status: 400, message: 'profileVersion must be a positive integer' });

    expect(
      validateFeedbackInput({ ...validBody, profileVersion: 1.5 }),
    ).toEqual({ status: 400, message: 'profileVersion must be a positive integer' });

    expect(
      validateFeedbackInput({ ...validBody, profileVersion: '1' }),
    ).toEqual({ status: 400, message: 'profileVersion must be a positive integer' });
  });
});
