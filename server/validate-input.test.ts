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

  it('returns 400 when the body is not a JSON object', () => {
    expect(validateFeedbackInput(null)).toEqual({
      status: 400,
      message: 'Request body must be a JSON object',
    });
    expect(validateFeedbackInput('string')).toEqual({
      status: 400,
      message: 'Request body must be a JSON object',
    });
  });

  it('returns 400 when the body is an array', () => {
    expect(validateFeedbackInput([])).toEqual({
      status: 400,
      message: 'slug is required',
    });
  });

  it('returns 400 when failureReasons contains non-string values', () => {
    expect(
      validateFeedbackInput({
        ...validBody,
        outcome: 'failure',
        failureReasons: [1, 2],
      }),
    ).toEqual({ status: 400, message: 'failureReasons must be an array of strings' });

    expect(
      validateFeedbackInput({
        ...validBody,
        outcome: 'failure',
        failureReasons: ['valid', 123],
      }),
    ).toEqual({ status: 400, message: 'failureReasons must be an array of strings' });
  });
});
