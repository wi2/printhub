import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../lib/msw/server';
import { FeedbackPrompt, FAILURE_REASONS } from './FeedbackPrompt';

const SLUG = 'bambu-a1-mini-pla-04mm-balanced';
const PROFILE_VERSION = 1;

describe('FeedbackPrompt', () => {
  beforeEach(() => {
    server.use(
      http.post('/api/feedback', () => HttpResponse.json({ ok: true })),
    );
  });

  it('renders the question and three response buttons on page load', () => {
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

    expect(
      screen.getByRole('heading', { name: 'How did your print go?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes — it worked' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No — it failed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "I haven't printed yet" })).toBeInTheDocument();
  });

  it('shows a thank-you message after clicking Yes and hides the response buttons', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: 'Yes — it worked' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Thanks. This helps us improve the profile for everyone.',
    );
    expect(screen.queryByRole('button', { name: 'Yes — it worked' })).not.toBeInTheDocument();
  });

  it('shows the failure reason form after clicking No', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: 'No — it failed' }));

    expect(screen.getByText('What went wrong?')).toBeInTheDocument();
    for (const reason of FAILURE_REASONS) {
      expect(screen.getByRole('checkbox', { name: reason })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('allows multi-select failure reasons and submits a thank-you message', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

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
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: "I haven't printed yet" }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'No problem — come back after your print and let us know how it went.',
    );
    expect(screen.queryByRole('button', { name: "I haven't printed yet" })).not.toBeInTheDocument();
  });

  it('does not show an email field on the not-yet path', async () => {
    const user = userEvent.setup();
    render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: "I haven't printed yet" }));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/remind me|email/i)).not.toBeInTheDocument();
  });

  describe('API submission', () => {
    it('calls POST /api/feedback with outcome success when Yes is clicked', async () => {
      let capturedBody: unknown;
      server.use(
        http.post('/api/feedback', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ ok: true });
        }),
      );

      const user = userEvent.setup();
      render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

      await user.click(screen.getByRole('button', { name: 'Yes — it worked' }));

      expect(capturedBody).toEqual({
        slug: SLUG,
        outcome: 'success',
        profileVersion: PROFILE_VERSION,
      });
    });

    it('calls POST /api/feedback with failure reasons when failure form is submitted', async () => {
      let capturedBody: unknown;
      server.use(
        http.post('/api/feedback', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ ok: true });
        }),
      );

      const user = userEvent.setup();
      render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

      await user.click(screen.getByRole('button', { name: 'No — it failed' }));
      await user.click(screen.getByRole('checkbox', { name: 'Stringing or oozing' }));
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(capturedBody).toEqual({
        slug: SLUG,
        outcome: 'failure',
        profileVersion: PROFILE_VERSION,
        failureReasons: ['Stringing or oozing'],
      });
    });

    it('calls POST /api/feedback with outcome pending when I haven\'t printed yet is clicked', async () => {
      let capturedBody: unknown;
      server.use(
        http.post('/api/feedback', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ ok: true });
        }),
      );

      const user = userEvent.setup();
      render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

      await user.click(screen.getByRole('button', { name: "I haven't printed yet" }));

      expect(capturedBody).toEqual({
        slug: SLUG,
        outcome: 'pending',
        profileVersion: PROFILE_VERSION,
      });
    });

    it('shows thank-you and logs to console when the API call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(http.post('/api/feedback', () => HttpResponse.error()));

      const user = userEvent.setup();
      render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

      await user.click(screen.getByRole('button', { name: 'Yes — it worked' }));

      expect(screen.getByRole('status')).toHaveTextContent(
        'Thanks. This helps us improve the profile for everyone.',
      );
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('shows thank-you and logs to console when fetch throws a network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const user = userEvent.setup();
      render(<FeedbackPrompt slug={SLUG} profileVersion={PROFILE_VERSION} />);

      await user.click(screen.getByRole('button', { name: 'Yes — it worked' }));

      expect(screen.getByRole('status')).toHaveTextContent(
        'Thanks. This helps us improve the profile for everyone.',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Feedback submission failed:',
        expect.any(TypeError),
      );

      consoleSpy.mockRestore();
      fetchSpy.mockRestore();
    });
  });
});
