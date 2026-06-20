import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurePage } from './ConfigurePage';

describe('ConfigurePage', () => {
  it('explains what a slicer profile is before the form', () => {
    render(
      <MemoryRouter>
        <ConfigurePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Configure your profile' })).toBeInTheDocument();
    expect(screen.getByText(/slicer profile is a preset file/i)).toBeInTheDocument();
    expect(screen.getByText(/only validated combinations can be generated/i)).toBeInTheDocument();
  });

  it('renders the combination form', () => {
    render(
      <MemoryRouter>
        <ConfigurePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Printer')).toBeInTheDocument();
  });
});
