import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';
import { PRINTERS } from '../../types';

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

  it('renders a product description', () => {
    renderHomePage();
    expect(screen.getByText(/ready-to-import slicer profiles/i)).toBeInTheDocument();
    expect(screen.getByText(/checked against safety limits/i)).toBeInTheDocument();
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

  it('explains how the product works in three steps', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText('Describe your setup')).toBeInTheDocument();
    expect(screen.getByText('Download your profile')).toBeInTheDocument();
    expect(screen.getByText('Print and share feedback')).toBeInTheDocument();
  });

  it('lists all supported printers', () => {
    renderHomePage();
    for (const printer of PRINTERS) {
      expect(screen.getByText(printer.name)).toBeInTheDocument();
    }
  });

  it('describes engineering validation honestly per ADR-003', () => {
    renderHomePage();
    expect(screen.getByText(/engineering validation/i)).toBeInTheDocument();
    expect(screen.getByText(/physical test prints/i)).toBeInTheDocument();
    expect(screen.queryByText(/validated on real hardware/i)).toBeNull();
  });

  it('lists coming soon items without implementing them', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { name: 'Coming soon' })).toBeInTheDocument();
    expect(screen.getByText('TPU profiles')).toBeInTheDocument();
    expect(screen.getByText('Quality-focused print goal')).toBeInTheDocument();
  });
});
