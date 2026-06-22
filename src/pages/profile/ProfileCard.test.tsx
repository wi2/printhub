import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ManifestEntry } from '../../types';
import { ProfileCard } from './ProfileCard';

const BAMBU_ENTRY: ManifestEntry = {
  slug: 'bambu-a1-mini-pla-04mm-balanced',
  printer: 'bambu-a1-mini',
  material: 'pla',
  nozzle: '0.4',
  goal: 'balanced',
  isAvailable: true,
  slicerFormat: 'bambu-orca',
  downloadPath: '/profiles/bambu-orca/bambu-a1-mini-pla-04mm-balanced.3mf',
  highlights: ['Speed highlight.', 'Layer highlight.', 'Temp highlight.'],
};

const PRUSA_ENTRY: ManifestEntry = {
  slug: 'prusa-mk4-pla-04mm-balanced',
  printer: 'prusa-mk4',
  material: 'pla',
  nozzle: '0.4',
  goal: 'balanced',
  isAvailable: true,
  slicerFormat: 'prusaslicer',
  downloadPath: '/profiles/prusaslicer/prusa-mk4-pla-04mm-balanced.ini',
  highlights: ['Speed highlight.', 'Layer highlight.', 'Temp highlight.'],
};

const PROFILE_VERSION = 1;

describe('ProfileCard download flow (S-3.7)', () => {
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement;
        link.click = clickSpy;
        return link;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
    });
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the feedback prompt on page load before download', () => {
    render(<ProfileCard entry={BAMBU_ENTRY} profileVersion={PROFILE_VERSION} />);

    expect(
      screen.getByRole('heading', { name: 'How did your print go?' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows validation status and before-printing guidance', () => {
    render(<ProfileCard entry={BAMBU_ENTRY} profileVersion={PROFILE_VERSION} />);

    expect(screen.getByRole('heading', { name: 'Validation status' })).toBeInTheDocument();
    expect(screen.getByText(/engineering validation/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Before you print' })).toBeInTheDocument();
    expect(
      screen.getByText('New profile — be the first to report results.'),
    ).toBeInTheDocument();
  });

  it('shows the download filename for confidence', () => {
    render(<ProfileCard entry={BAMBU_ENTRY} profileVersion={PROFILE_VERSION} />);

    expect(
      screen.getByLabelText('Download filename'),
    ).toHaveTextContent('bambu-a1-mini-pla-04mm-balanced.3mf');
  });

  it('reveals the import guide and download confirmation after the first download click', async () => {
    const user = userEvent.setup();
    render(<ProfileCard entry={BAMBU_ENTRY} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(screen.getByRole('status')).toHaveTextContent('Download started');
    expect(
      screen.getByRole('heading', { name: /how to import your profile into bambu studio/i }),
    ).toBeInTheDocument();
  });

  it('keeps the import guide visible when download is clicked again', async () => {
    const user = userEvent.setup();
    render(<ProfileCard entry={BAMBU_ENTRY} profileVersion={PROFILE_VERSION} />);

    const downloadButton = screen.getByRole('button', { name: 'Download profile' });
    await user.click(downloadButton);
    await user.click(downloadButton);

    expect(
      screen.getByRole('heading', { name: /how to import your profile into bambu studio/i }),
    ).toBeInTheDocument();
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('shows the PrusaSlicer import guide for Prusa-format profiles', async () => {
    const user = userEvent.setup();
    render(<ProfileCard entry={PRUSA_ENTRY} profileVersion={PROFILE_VERSION} />);

    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(
      screen.getByRole('heading', { name: /how to import your profile into prusaslicer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Open PrusaSlicer')).toBeInTheDocument();
  });
});
