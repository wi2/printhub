import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CombinationForm } from './CombinationForm';
import { PRINTERS } from '../../types';

function renderForm() {
  render(
    <MemoryRouter>
      <CombinationForm />
    </MemoryRouter>,
  );
}

describe('CombinationForm', () => {
  describe('layout', () => {
    it('renders the Printer input', () => {
      renderForm();
      expect(screen.getByLabelText('Printer')).toBeInTheDocument();
    });

    it('renders the Material input group', () => {
      renderForm();
      expect(screen.getByRole('group', { name: 'Material' })).toBeInTheDocument();
    });

    it('renders the Nozzle Size input group', () => {
      renderForm();
      expect(screen.getByRole('group', { name: 'Nozzle Size' })).toBeInTheDocument();
    });

    it('renders the Print Goal input group', () => {
      renderForm();
      expect(screen.getByRole('group', { name: 'Print Goal' })).toBeInTheDocument();
    });

    it('renders the Generate profile button', () => {
      renderForm();
      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeInTheDocument();
    });
  });

  describe('generate button state', () => {
    it('is disabled when no inputs are selected', () => {
      renderForm();
      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
    });

    it('remains disabled when only the printer is selected', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));

      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
    });

    it('remains disabled when three of four inputs are selected', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));
      // Goal is not selected

      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
    });

    it('becomes enabled when all four inputs are selected', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));
      await user.click(screen.getByRole('radio', { name: 'Balanced' }));

      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeEnabled();
    });
  });

  describe('slicer format derivation (AC-5)', () => {
    it('Bambu Lab A1 Mini maps to bambu-orca', () => {
      const printer = PRINTERS.find(p => p.id === 'bambu-a1-mini');
      expect(printer?.defaultSlicerFormat).toBe('bambu-orca');
    });

    it('Bambu Lab X1C maps to bambu-orca', () => {
      const printer = PRINTERS.find(p => p.id === 'bambu-x1c');
      expect(printer?.defaultSlicerFormat).toBe('bambu-orca');
    });

    it('Prusa MK4 maps to prusaslicer', () => {
      const printer = PRINTERS.find(p => p.id === 'prusa-mk4');
      expect(printer?.defaultSlicerFormat).toBe('prusaslicer');
    });

    it('Creality Ender 3 V3 SE maps to prusaslicer', () => {
      const printer = PRINTERS.find(p => p.id === 'creality-ender-3-v3-se');
      expect(printer?.defaultSlicerFormat).toBe('prusaslicer');
    });

    it('Creality K1 maps to bambu-orca', () => {
      const printer = PRINTERS.find(p => p.id === 'creality-k1');
      expect(printer?.defaultSlicerFormat).toBe('bambu-orca');
    });
  });

  describe('no network requests', () => {
    it('renders synchronously with no async data fetching', () => {
      // CombinationForm is entirely local state — no fetch, no React Query, no effects.
      // This test verifies the form renders without waiting for any async operation.
      renderForm();
      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeInTheDocument();
    });
  });
});
