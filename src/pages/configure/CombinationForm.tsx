import { useState } from 'react';
import { PRINTERS } from '../../types';
import { PrinterSelector } from './PrinterSelector';
import { MaterialSelector } from './MaterialSelector';
import { NozzleSelector } from './NozzleSelector';
import { GoalSelector } from './GoalSelector';

/**
 * Owns the complete selection state for all four combination inputs.
 *
 * Derives slicerFormat from the selected printer on every render — not stored
 * separately and never shown to the user. The derivation will be consumed by
 * the download and submission logic added in S-3.4 and S-3.7.
 *
 * Form submission (navigation to /profile/[slug]) is wired in S-3.4.
 */
export function CombinationForm() {
  const [printer, setPrinter] = useState<string | undefined>(undefined);
  const [material, setMaterial] = useState<string | undefined>(undefined);
  const [nozzle, setNozzle] = useState<string | undefined>(undefined);
  const [goal, setGoal] = useState<string | undefined>(undefined);

  // Derived from printer — Bambu printers → 'bambu-orca', Prusa/Creality → 'prusaslicer'.
  // Not shown to users and not overridable.
  const _slicerFormat = printer
    ? PRINTERS.find(p => p.id === printer)?.defaultSlicerFormat
    : undefined;
  void _slicerFormat; // used in S-3.4 and S-3.7

  const isComplete = Boolean(printer && material && nozzle && goal);

  return (
    <form
      onSubmit={e => e.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <PrinterSelector value={printer} onChange={setPrinter} />
      <MaterialSelector value={material} onChange={setMaterial} />
      <NozzleSelector value={nozzle} onChange={setNozzle} />
      <GoalSelector value={goal} onChange={setGoal} />
      <div>
        <button
          type="submit"
          disabled={!isComplete}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            cursor: isComplete ? 'pointer' : 'not-allowed',
            backgroundColor: isComplete ? '#111' : '#ccc',
            color: isComplete ? '#fff' : '#666',
          }}
        >
          Generate profile
        </button>
      </div>
    </form>
  );
}
