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
    render(<ProfileCard entry={BAMBU_ENTRY} />);

    expect(
      screen.getByText('Did your print succeed with this profile?'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Download started')).not.toBeInTheDocument();
  });

  it('reveals the import guide and download confirmation after the first download click', async () => {
    const user = userEvent.setup();
    render(<ProfileCard entry={BAMBU_ENTRY} />);

    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(screen.getByRole('status')).toHaveTextContent('Download started');
    expect(
      screen.getByRole('heading', { name: /how to import your profile into bambu studio/i }),
    ).toBeInTheDocument();
  });

  it('keeps the import guide visible when download is clicked again', async () => {
    const user = userEvent.setup();
    render(<ProfileCard entry={BAMBU_ENTRY} />);

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
    render(<ProfileCard entry={PRUSA_ENTRY} />);

    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(
      screen.getByRole('heading', { name: /how to import your profile into prusaslicer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Open PrusaSlicer')).toBeInTheDocument();
  });
});
