import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ManifestEntry } from '../../types';
import { DownloadButton } from './DownloadButton';

const MOCK_ENTRY: ManifestEntry = {
  slug: 'bambu-a1-mini-pla-04mm-balanced',
  printer: 'bambu-a1-mini',
  material: 'pla',
  nozzle: '0.4',
  goal: 'balanced',
  isAvailable: true,
  slicerFormat: 'bambu-orca',
  downloadPath: '/profiles/bambu-orca/bambu-a1-mini-pla-04mm-balanced.3mf',
  highlights: ['One.', 'Two.', 'Three.'],
};

describe('DownloadButton', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createdLink: HTMLAnchorElement | undefined;

  beforeEach(() => {
    clickSpy = vi.fn();
    createdLink = undefined;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement;
        link.click = clickSpy;
        createdLink = link;
        return link;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers a download with the correct filename and path for Bambu/Orca profiles', async () => {
    const user = userEvent.setup();
    render(<DownloadButton entry={MOCK_ENTRY} onDownloadStarted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(createdLink?.href).toContain('/profiles/bambu-orca/bambu-a1-mini-pla-04mm-balanced.3mf');
    expect(createdLink?.download).toBe('bambu-a1-mini-pla-04mm-balanced.3mf');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('uses a .ini extension for PrusaSlicer profiles', async () => {
    const user = userEvent.setup();
    const prusaEntry: ManifestEntry = {
      ...MOCK_ENTRY,
      slug: 'prusa-mk4-pla-04mm-balanced',
      slicerFormat: 'prusaslicer',
      downloadPath: '/profiles/prusaslicer/prusa-mk4-pla-04mm-balanced.ini',
    };

    render(<DownloadButton entry={prusaEntry} onDownloadStarted={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Download profile' }));

    expect(createdLink?.download).toBe('prusa-mk4-pla-04mm-balanced.ini');
  });

  it('calls onDownloadStarted only on the first click', async () => {
    const user = userEvent.setup();
    const onDownloadStarted = vi.fn();
    render(<DownloadButton entry={MOCK_ENTRY} onDownloadStarted={onDownloadStarted} />);

    const button = screen.getByRole('button', { name: 'Download profile' });
    await user.click(button);
    await user.click(button);

    expect(onDownloadStarted).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
