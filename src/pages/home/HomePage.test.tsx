import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';

function renderHomePage() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/configure" element={<div>Configure page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders a headline', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders a description', () => {
    renderHomePage();
    expect(screen.getByText(/validated on real hardware/i)).toBeInTheDocument();
  });

  it('renders a single "Generate my profile" CTA', () => {
    renderHomePage();
    expect(
      screen.getByRole('link', { name: 'Generate my profile' }),
    ).toBeInTheDocument();
  });

  it('navigates to /configure when the CTA is clicked', async () => {
    const user = userEvent.setup();
    renderHomePage();

    await user.click(screen.getByRole('link', { name: 'Generate my profile' }));

    expect(screen.getByText('Configure page')).toBeInTheDocument();
  });

  it('renders no registration, login, or pricing content', () => {
    renderHomePage();
    expect(screen.queryByText(/sign up|log in|login|register|price|\$/i)).toBeNull();
  });
});
