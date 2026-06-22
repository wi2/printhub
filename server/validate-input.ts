import type { FeedbackOutcome } from '../src/types.js';

const VALID_OUTCOMES = new Set<FeedbackOutcome>(['success', 'failure', 'pending']);

export type FeedbackRequest = {
  slug: string;
  outcome: FeedbackOutcome;
  profileVersion: number;
  failureReasons?: string[];
};

export type ValidationError = {
  status: 400;
  message: string;
};

/**
 * Validates a parsed JSON body for POST /api/feedback.
 * Returns a typed request on success or a 400 error descriptor.
 */
export function validateFeedbackInput(
  body: unknown,
): FeedbackRequest | ValidationError {
  if (typeof body !== 'object' || body === null) {
    return { status: 400, message: 'Request body must be a JSON object' };
  }

  const record = body as Record<string, unknown>;
  const { slug, outcome, profileVersion, failureReasons } = record;

  if (typeof slug !== 'string' || slug.trim() === '') {
    return { status: 400, message: 'slug is required' };
  }

  if (profileVersion === undefined) {
    return { status: 400, message: 'profileVersion is required' };
  }

  if (
    typeof profileVersion !== 'number' ||
    !Number.isInteger(profileVersion) ||
    profileVersion < 1
  ) {
    return { status: 400, message: 'profileVersion must be a positive integer' };
  }

  if (typeof outcome !== 'string' || !VALID_OUTCOMES.has(outcome as FeedbackOutcome)) {
    return {
      status: 400,
      message: 'outcome must be "success", "failure", or "pending"',
    };
  }

  if (failureReasons !== undefined) {
    if (outcome !== 'failure') {
      return {
        status: 400,
        message: 'failureReasons is only allowed when outcome is "failure"',
      };
    }

    if (
      !Array.isArray(failureReasons) ||
      !failureReasons.every(reason => typeof reason === 'string')
    ) {
      return { status: 400, message: 'failureReasons must be an array of strings' };
    }
  }

  return {
    slug,
    outcome: outcome as FeedbackOutcome,
    profileVersion,
    failureReasons: failureReasons as string[] | undefined,
  };
}
