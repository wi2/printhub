import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';

function renderAtProfileRoute(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/profile/${slug}`]}>
      <Routes>
        <Route path="/profile/:slug" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  it('renders the profile title', () => {
    renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Bambu A1 Mini · PLA · 0.4mm · Balanced',
    );
  });

  it('renders three highlight sentences', () => {
    renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the confidence count placeholder', () => {
    renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
    expect(
      screen.getByText('New profile — be the first to report results.'),
    ).toBeInTheDocument();
  });

  it('renders a non-functional download button', () => {
    renderAtProfileRoute('bambu-a1-mini-pla-04mm-balanced');
    expect(
      screen.getByRole('button', { name: 'Download profile' }),
    ).toBeInTheDocument();
  });
});
