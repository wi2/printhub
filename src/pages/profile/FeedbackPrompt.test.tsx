import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackPrompt, FAILURE_REASONS } from './FeedbackPrompt';

describe('FeedbackPrompt', () => {
  it('renders the question and three response buttons on page load', () => {
    render(<FeedbackPrompt />);

    expect(
      screen.getByText('Did your print succeed with this profile?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes — it worked' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No — it failed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "I haven't printed yet" })).toBeInTheDocument();
  });

  it('shows a thank-you message after clicking Yes and hides the response buttons', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt />);

    await user.click(screen.getByRole('button', { name: 'Yes — it worked' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Thanks. This helps us improve the profile for everyone.',
    );
    expect(screen.queryByRole('button', { name: 'Yes — it worked' })).not.toBeInTheDocument();
  });

  it('shows the failure reason form after clicking No', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt />);

    await user.click(screen.getByRole('button', { name: 'No — it failed' }));

    expect(screen.getByText('What went wrong?')).toBeInTheDocument();
    for (const reason of FAILURE_REASONS) {
      expect(screen.getByRole('checkbox', { name: reason })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('allows multi-select failure reasons and submits a thank-you message', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt />);

    await user.click(screen.getByRole('button', { name: 'No — it failed' }));
    await user.click(screen.getByRole('checkbox', { name: 'Stringing or oozing' }));
    await user.click(screen.getByRole('checkbox', { name: 'Layer separation' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      "Thanks for the report. We'll review this combination.",
    );
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('shows the not-yet message after clicking I haven\'t printed yet', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt />);

    await user.click(screen.getByRole('button', { name: "I haven't printed yet" }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'No problem — come back after your print and let us know how it went.',
    );
    expect(screen.queryByRole('button', { name: "I haven't printed yet" })).not.toBeInTheDocument();
  });

  it('does not show an email field on the not-yet path', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt />);

    await user.click(screen.getByRole('button', { name: "I haven't printed yet" }));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/remind me|email/i)).not.toBeInTheDocument();
  });
});
