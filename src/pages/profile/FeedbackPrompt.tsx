/**
 * Asks whether the user's print succeeded. Full interaction wired in S-3.8;
 * rendered on page load so users see it below the import guide area.
 */
export function FeedbackPrompt() {
  return (
    <section aria-label="Print feedback">
      <p>Did your print succeed with this profile?</p>
    </section>
  );
}
