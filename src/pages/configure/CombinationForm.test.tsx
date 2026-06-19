import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '../../lib/msw/server';
import { _resetManifestCache } from './availability';
import { CombinationForm } from './CombinationForm';
import { PRINTERS } from '../../types';

// Full manifest: all materials + nozzles available for the printers used in S-3.2 tests.
const FULL_MANIFEST = {
  combinations: [
    { printer: 'prusa-mk4', material: 'pla',  nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's1', slicerFormat: 'prusaslicer', downloadPath: '/d/s1', highlights: ['a','b','c'] },
    { printer: 'prusa-mk4', material: 'pla',  nozzle: '0.6', goal: 'balanced', isAvailable: true, slug: 's2', slicerFormat: 'prusaslicer', downloadPath: '/d/s2', highlights: ['a','b','c'] },
    { printer: 'prusa-mk4', material: 'petg', nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's3', slicerFormat: 'prusaslicer', downloadPath: '/d/s3', highlights: ['a','b','c'] },
    { printer: 'prusa-mk4', material: 'tpu',  nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's4', slicerFormat: 'prusaslicer', downloadPath: '/d/s4', highlights: ['a','b','c'] },
    { printer: 'bambu-a1-mini', material: 'pla',  nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's5', slicerFormat: 'bambu-orca', downloadPath: '/d/s5', highlights: ['a','b','c'] },
    { printer: 'bambu-a1-mini', material: 'petg', nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's6', slicerFormat: 'bambu-orca', downloadPath: '/d/s6', highlights: ['a','b','c'] },
  ],
};

// Partial manifest: Bambu A1 Mini only has PLA/0.4 — no TPU, no 0.6mm PLA.
const PARTIAL_MANIFEST = {
  combinations: [
    { printer: 'bambu-a1-mini', material: 'pla', nozzle: '0.4', goal: 'balanced', isAvailable: true, slug: 's5', slicerFormat: 'bambu-orca', downloadPath: '/d/s5', highlights: ['a','b','c'] },
  ],
};

function mockManifest(manifest = FULL_MANIFEST) {
  server.use(http.get('/combinations.json', () => HttpResponse.json(manifest)));
}

function renderForm() {
  render(
    <MemoryRouter>
      <CombinationForm />
    </MemoryRouter>,
  );
}

/** Renders the form with a full router so navigation can be asserted. */
function renderFormWithRouter() {
  render(
    <MemoryRouter initialEntries={['/configure']}>
      <Routes>
        <Route path="/configure" element={<CombinationForm />} />
        <Route path="/profile/:slug" element={<div>profile-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillAllInputs(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
  await waitFor(() => expect(screen.getByRole('radio', { name: 'PLA' })).not.toBeDisabled());
  await user.click(screen.getByRole('radio', { name: 'PLA' }));
  await user.click(screen.getByRole('radio', { name: '0.4mm' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  await user.click(screen.getByRole('radio', { name: 'Balanced' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Generate profile' })).toBeEnabled(),
  );
}

beforeEach(() => mockManifest());
afterEach(() => _resetManifestCache());

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

      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
    });

    it('becomes enabled when all four inputs are selected for a valid combination', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));
      await user.click(screen.getByRole('radio', { name: 'Balanced' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate profile' })).toBeEnabled();
      });
    });
  });

  describe('availability — material greying (AC-3)', () => {
    beforeEach(() => mockManifest(PARTIAL_MANIFEST));

    it('disables a material option when no validated profile exists for that printer + material', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));

      // TPU has no profile for bambu-a1-mini in the partial manifest
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: 'TPU (95A)' })).toBeDisabled();
      });
    });

    it('keeps available materials enabled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: 'PLA' })).toBeEnabled();
      });
    });

    it('clears material and nozzle selections when the printer changes', async () => {
      const user = userEvent.setup();
      renderForm();

      // Select Prusa MK4 first (full manifest → PLA available)
      mockManifest(FULL_MANIFEST);
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));

      expect(screen.getByRole('radio', { name: 'PLA' })).toBeChecked();
      expect(screen.getByRole('radio', { name: '0.4mm' })).toBeChecked();

      // Change printer — material and nozzle should clear
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));

      expect(screen.getByRole('radio', { name: 'PLA' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: '0.4mm' })).not.toBeChecked();
    });
  });

  describe('availability — nozzle validation message (AC-4)', () => {
    beforeEach(() => mockManifest(PARTIAL_MANIFEST));

    it('shows a message when the selected nozzle has no validated profile for the combo', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      // 0.6mm has no profile in the partial manifest
      await user.click(screen.getByRole('radio', { name: '0.6mm' }));

      await waitFor(() => {
        expect(
          screen.getByText(/We haven't validated a 0\.6mm profile for this combination yet\./),
        ).toBeInTheDocument();
      });
    });

    it('keeps the generate button disabled when the nozzle message is shown', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.6mm' }));
      await user.click(screen.getByRole('radio', { name: 'Balanced' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Generate profile' })).toBeDisabled();
    });

    it('shows no message when the selected nozzle has a validated profile', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Bambu Lab A1 Mini' }));
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('slicer format derivation (S-3.2 AC-5)', () => {
    it('Bambu Lab A1 Mini maps to bambu-orca', () => {
      expect(PRINTERS.find(p => p.id === 'bambu-a1-mini')?.defaultSlicerFormat).toBe('bambu-orca');
    });
    it('Bambu Lab X1C maps to bambu-orca', () => {
      expect(PRINTERS.find(p => p.id === 'bambu-x1c')?.defaultSlicerFormat).toBe('bambu-orca');
    });
    it('Prusa MK4 maps to prusaslicer', () => {
      expect(PRINTERS.find(p => p.id === 'prusa-mk4')?.defaultSlicerFormat).toBe('prusaslicer');
    });
    it('Creality Ender 3 V3 SE maps to prusaslicer', () => {
      expect(PRINTERS.find(p => p.id === 'creality-ender-3-v3-se')?.defaultSlicerFormat).toBe('prusaslicer');
    });
    it('Creality K1 maps to bambu-orca', () => {
      expect(PRINTERS.find(p => p.id === 'creality-k1')?.defaultSlicerFormat).toBe('bambu-orca');
    });
  });

  // S-3.4: submit tests run in real time (800ms delay is real, waitFor timeout is 2000ms).
  // Fake timers are not used here because waitFor polling also uses setTimeout.
  describe('form submission (S-3.4)', () => {
    it('shows "Generating…" and locks inputs immediately after submit', async () => {
      const user = userEvent.setup();
      renderFormWithRouter();
      await fillAllInputs(user);

      // click() resolves after the synchronous event chain — before the 800ms delay fires.
      await user.click(screen.getByRole('button', { name: 'Generate profile' }));

      expect(screen.getByRole('button', { name: 'Generating…' })).toBeInTheDocument();
      // fieldset[disabled] propagates to the combobox inside it
      expect(screen.getByRole('combobox')).toBeDisabled();

      // Let the 800ms delay finish so there are no pending state updates after the test.
      await waitFor(
        () => expect(screen.getByText('profile-page')).toBeInTheDocument(),
        { timeout: 2000 },
      );
    }, 3000);

    it('navigates to /profile/[slug] after the delay for a valid combination', async () => {
      const user = userEvent.setup();
      renderFormWithRouter();
      await fillAllInputs(user);

      await user.click(screen.getByRole('button', { name: 'Generate profile' }));

      await waitFor(
        () => expect(screen.getByText('profile-page')).toBeInTheDocument(),
        { timeout: 2000 },
      );
    }, 3000);

    it('shows an error and does not navigate when the combination is not in the manifest', async () => {
      // Manifest has the nozzle combo (isNozzleAvailable → true, canGenerate → true)
      // but NOT the balanced goal — so isAvailable(…, 'balanced') returns false.
      const noBalancedManifest = {
        combinations: [
          { printer: 'prusa-mk4', material: 'pla', nozzle: '0.4', goal: 'quality',
            isAvailable: true, slug: 'x', slicerFormat: 'prusaslicer',
            downloadPath: '/d/x', highlights: ['a', 'b', 'c'] },
        ],
      };
      server.use(http.get('/combinations.json', () => HttpResponse.json(noBalancedManifest)));

      const user = userEvent.setup();
      renderFormWithRouter();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));
      await waitFor(() => expect(screen.getByRole('radio', { name: 'PLA' })).not.toBeDisabled());
      await user.click(screen.getByRole('radio', { name: 'PLA' }));
      await user.click(screen.getByRole('radio', { name: '0.4mm' }));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      await user.click(screen.getByRole('radio', { name: 'Balanced' }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Generate profile' })).toBeEnabled(),
      );

      await user.click(screen.getByRole('button', { name: 'Generate profile' }));

      await waitFor(
        () =>
          expect(
            screen.getAllByRole('alert').some(el =>
              /validated profile/.test(el.textContent ?? ''),
            ),
          ).toBe(true),
        { timeout: 2000 },
      );
      expect(screen.queryByText('profile-page')).not.toBeInTheDocument();
    }, 3000);
  });
});
