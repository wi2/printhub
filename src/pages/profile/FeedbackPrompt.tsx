import { useState } from 'react';
import type { FeedbackOutcome } from '../../types';

/** Preset failure reasons from mvp-spec.md Stage 5 — shared with the feedback API in M4. */
export const FAILURE_REASONS = [
  'Warping / lifting corners',
  'Stringing or oozing',
  'Layer separation',
  'Under-extrusion (gaps, thin lines)',
  "Other / I'm not sure",
] as const;

type FailureReason = (typeof FAILURE_REASONS)[number];

type FeedbackState =
  | { status: 'idle' }
  | { status: 'failure-form'; selectedReasons: FailureReason[] }
  | { status: 'confirmed'; message: string };

type FeedbackPayload = {
  slug: string;
  outcome: FeedbackOutcome;
  failureReasons?: string[];
};

const SUCCESS_MESSAGE = 'Thanks. This helps us improve the profile for everyone.';
const FAILURE_MESSAGE = "Thanks for the report. We'll review this combination.";
const PENDING_MESSAGE =
  'No problem — come back after your print and let us know how it went.';

/**
 * Submits feedback fire-and-forget. Failures are logged to the console only —
 * the user always sees the confirmation message immediately.
 */
function submitFeedback(payload: FeedbackPayload): void {
  void fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(response => {
      if (!response.ok) {
        console.error(
          'Feedback submission failed:',
          response.status,
          response.statusText,
        );
      }
    })
    .catch(error => {
      console.error('Feedback submission failed:', error);
    });
}

type FeedbackPromptProps = {
  slug: string;
};

/**
 * Collects anonymous print outcome feedback on the profile page.
 * Renders on page load; buttons are replaced by a confirmation after one response.
 */
export function FeedbackPrompt({ slug }: FeedbackPromptProps) {
  const [state, setState] = useState<FeedbackState>({ status: 'idle' });

  function handleToggleReason(reason: FailureReason) {
    setState(current => {
      if (current.status !== 'failure-form') return current;

      const selectedReasons = current.selectedReasons.includes(reason)
        ? current.selectedReasons.filter(item => item !== reason)
        : [...current.selectedReasons, reason];

      return { status: 'failure-form', selectedReasons };
    });
  }

  function handleSubmitFailure() {
    setState(current => {
      if (current.status !== 'failure-form' || current.selectedReasons.length === 0) {
        return current;
      }

      submitFeedback({
        slug,
        outcome: 'failure',
        failureReasons: current.selectedReasons,
      });

      return { status: 'confirmed', message: FAILURE_MESSAGE };
    });
  }

  function handleSuccess() {
    submitFeedback({ slug, outcome: 'success' });
    setState({ status: 'confirmed', message: SUCCESS_MESSAGE });
  }

  function handlePending() {
    submitFeedback({ slug, outcome: 'pending' });
    setState({ status: 'confirmed', message: PENDING_MESSAGE });
  }

  if (state.status === 'confirmed') {
    return (
      <section className="card" aria-label="Print feedback">
        <p role="status" style={{ margin: 0 }}>
          {state.message}
        </p>
      </section>
    );
  }

  if (state.status === 'failure-form') {
    return (
      <section className="card" aria-label="Print feedback">
        <h2 id="failure-question">What went wrong?</h2>
        <fieldset aria-labelledby="failure-question" style={{ border: 'none', padding: 0, margin: 0 }}>
          {FAILURE_REASONS.map(reason => (
            <label key={reason} style={{ display: 'block', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={state.selectedReasons.includes(reason)}
                onChange={() => handleToggleReason(reason)}
              />{' '}
              {reason}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          className="btn btn-primary"
          disabled={state.selectedReasons.length === 0}
          onClick={handleSubmitFailure}
        >
          Submit
        </button>
      </section>
    );
  }

  return (
    <section className="card" aria-label="Print feedback">
      <h2>How did your print go?</h2>
      <p className="text-muted">Your feedback helps improve this profile for others.</p>
      <div className="btn-group">
        <button type="button" className="btn btn-secondary" onClick={handleSuccess}>
          Yes — it worked
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setState({ status: 'failure-form', selectedReasons: [] })}
        >
          No — it failed
        </button>
        <button type="button" className="btn btn-secondary" onClick={handlePending}>
          I haven&apos;t printed yet
        </button>
      </div>
    </section>
  );
}
