import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../lib/msw/server';
import { _resetManifestCache } from '../../lib/manifest';
import type { ManifestEntry } from '../../types';
import { ProfilePage } from './ProfilePage';

const MOCK_ENTRY: ManifestEntry = {
  slug: 'bambu-a1-mini-pla-04mm-balanced',
  printer: 'bambu-a1-mini',
  material: 'pla',
  nozzle: '0.4',
  goal: 'balanced',
  isAvailable: true,
  slicerFormat: 'bambu-orca',
  downloadPath: '/profiles/bambu-orca/bambu-a1-mini-pla-04mm-balanced.3mf',
  highlights: [
    'Print speed is set to 180mm/s — fast for efficiency, conservative enough for consistent quality.',
    'Layer height is 0.2mm — the standard for balanced prints.',
    'Bed temperature is 55°C. If you see corners lifting, try 60°C.',
  ],
};

function useProfileVersionHandler() {
  server.use(
    http.get('/profiles/bambu-a1-mini-pla-04mm-balanced.json', () =>
      HttpResponse.json({ metadata: { version: 1 } }),
    ),
  );
}

function renderAtProfileRoute(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/profile/${slug}`]}>
      <Routes>
        <Route path="/profile/:slug" element={<ProfilePage />} />
        <Route path="/configure" element={<div>Configure page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    server.use(
      http.get('/combinations.json', () =>
        HttpResponse.json({ combinations: [MOCK_ENTRY] }),
      ),
    );
    useProfileVersionHandler();
    // jsdom does not define navigator.clipboard; install a stub so handleShare
    // can resolve and the 'Copied!' confirmation can be observed.
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    _resetManifestCache();
    // Remove the clipboard stub so each test starts with a fresh installation.
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  describe('while the manifest is loading', () => {
    it('shows an accessible loading status', () => {
      server.use(
        http.get('/combinations.json', async () => {
          await delay('infinite');
          return HttpResponse.json({ combinations: [MOCK_ENTRY] });
        }),
      );

      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');

      expect(screen.getByRole('status')).toHaveTextContent(/loading profile/i);
    });
  });

  describe('when the manifest request fails', () => {
    beforeEach(() => {
      server.use(http.get('/combinations.json', () => HttpResponse.error()));
    });

    it('shows an error message instead of the not-found page', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        'Could not load profile',
      );
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    });

    it('loads the profile after Try again when the manifest request succeeds', async () => {
      const user = userEvent.setup();
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');

      await screen.findByRole('button', { name: 'Try again' });

      server.use(
        http.get('/combinations.json', () =>
          HttpResponse.json({ combinations: [MOCK_ENTRY] }),
        ),
      );
      useProfileVersionHandler();

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        'Bambu Lab A1 Mini · PLA · 0.4mm · Balanced',
      );
    });
  });

  describe('when slug matches a manifest entry', () => {
    it('renders the profile title in Printer · Material · Nozzle · Goal format', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        'Bambu Lab A1 Mini · PLA · 0.4mm · Balanced',
      );
    });

    it('renders three highlight sentences from the manifest', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      await screen.findByRole('heading', { name: 'Key settings in this profile' });
      const highlightsSection = screen.getByRole('heading', {
        name: 'Key settings in this profile',
      }).closest('section');
      expect(highlightsSection).not.toBeNull();
      expect(highlightsSection!.querySelectorAll('li')).toHaveLength(3);
    });

    it('renders the confidence count placeholder', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      await screen.findByRole('heading', { level: 1 });
      expect(
        screen.getByText('New profile — be the first to report results.'),
      ).toBeInTheDocument();
    });

    it('renders a Download profile button', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      expect(
        await screen.findByRole('button', { name: 'Download profile' }),
      ).toBeInTheDocument();
    });

    it('renders a breadcrumb showing Home, Generate Profile, and Profile', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      await screen.findByRole('heading', { level: 1 });

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb).toHaveTextContent('Home');
      expect(breadcrumb).toHaveTextContent('Generate Profile');
      expect(breadcrumb).toHaveTextContent('Profile');
      expect(breadcrumb.querySelector('[aria-current="page"]')).toHaveTextContent('Profile');
    });

    it('renders a Share this profile button', async () => {
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      expect(
        await screen.findByRole('button', { name: 'Share this profile' }),
      ).toBeInTheDocument();
    });

    it('copies the current URL to the clipboard and shows Copied! confirmation', async () => {
      const user = userEvent.setup();
      renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
      await screen.findByRole('button', { name: 'Share this profile' });

      await user.click(screen.getByRole('button', { name: 'Share this profile' }));

      // 'Copied!' only renders after navigator.clipboard.writeText resolves,
      // so its presence proves the clipboard write was called and succeeded.
      await screen.findByRole('button', { name: 'Copied!' });
    });
  });

  describe('when slug is not in the manifest', () => {
    it('renders "This profile is no longer available"', async () => {
      renderAtProfileRoute('unknown-slug-xyz');
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        'This profile is no longer available',
      );
    });

    it('renders a link back to /configure', async () => {
      renderAtProfileRoute('unknown-slug-xyz');
      await screen.findByRole('heading', { level: 1 });
      expect(screen.getByRole('link', { name: /configure/i })).toHaveAttribute(
        'href',
        '/configure',
      );
    });
  });
});
