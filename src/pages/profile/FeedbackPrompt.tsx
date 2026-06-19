import { useState } from 'react';

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

const SUCCESS_MESSAGE = 'Thanks. This helps us improve the profile for everyone.';
const FAILURE_MESSAGE = "Thanks for the report. We'll review this combination.";
const PENDING_MESSAGE =
  'No problem — come back after your print and let us know how it went.';

/**
 * Collects anonymous print outcome feedback on the profile page.
 * Renders on page load; buttons are replaced by a confirmation after one response.
 * API submission is wired in M4 — this component manages UI state only.
 */
export function FeedbackPrompt() {
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
      return { status: 'confirmed', message: FAILURE_MESSAGE };
    });
  }

  if (state.status === 'confirmed') {
    return (
      <section aria-label="Print feedback">
        <p role="status">{state.message}</p>
      </section>
    );
  }

  if (state.status === 'failure-form') {
    return (
      <section aria-label="Print feedback">
        <p id="failure-question">What went wrong?</p>
        <fieldset aria-labelledby="failure-question">
          {FAILURE_REASONS.map(reason => (
            <label key={reason}>
              <input
                type="checkbox"
                checked={state.selectedReasons.includes(reason)}
                onChange={() => handleToggleReason(reason)}
              />
              {reason}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          disabled={state.selectedReasons.length === 0}
          onClick={handleSubmitFailure}
        >
          Submit
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Print feedback">
      <p>Did your print succeed with this profile?</p>
      <button
        type="button"
        onClick={() => setState({ status: 'confirmed', message: SUCCESS_MESSAGE })}
      >
        Yes — it worked
      </button>
      <button
        type="button"
        onClick={() => setState({ status: 'failure-form', selectedReasons: [] })}
      >
        No — it failed
      </button>
      <button
        type="button"
        onClick={() => setState({ status: 'confirmed', message: PENDING_MESSAGE })}
      >
        I haven&apos;t printed yet
      </button>
    </section>
  );
}
