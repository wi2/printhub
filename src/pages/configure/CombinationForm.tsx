import { useState, useEffect } from 'react';
import { MATERIALS, NOZZLE_SIZES, PRINTERS } from '../../types';
import { isMaterialAvailable, isNozzleAvailable } from './availability';
import { PrinterSelector } from './PrinterSelector';
import { MaterialSelector } from './MaterialSelector';
import { NozzleSelector } from './NozzleSelector';
import { GoalSelector } from './GoalSelector';

/**
 * Owns the complete selection state for all four combination inputs.
 *
 * Availability behaviour (S-3.3):
 * - Loads available materials for the selected printer via module-level cache.
 * - Passes disabled material ids to MaterialSelector.
 * - Checks nozzle availability and shows a message when the combo is not yet validated.
 *
 * Form submission / navigation to /profile/[slug] is wired in S-3.4.
 */
export function CombinationForm() {
  const [printer, setPrinter] = useState<string | undefined>(undefined);
  const [material, setMaterial] = useState<string | undefined>(undefined);
  const [nozzle, setNozzle] = useState<string | undefined>(undefined);
  const [goal, setGoal] = useState<string | undefined>(undefined);

  // Ids of materials not available for the current printer.
  const [disabledMaterials, setDisabledMaterials] = useState<readonly string[]>([]);
  // Non-empty when printer+material+nozzle has no validated profile.
  const [nozzleMessage, setNozzleMessage] = useState<string | undefined>(undefined);

  // Derived from printer — Bambu printers → 'bambu-orca', Prusa/Creality → 'prusaslicer'.
  // Not shown to users and not overridable. Consumed in S-3.4 and S-3.7.
  const slicerFormat = printer
    ? PRINTERS.find(p => p.id === printer)?.defaultSlicerFormat
    : undefined;
  void slicerFormat;

  // When the printer changes, clear downstream selections and reload material availability.
  function handlePrinterChange(printerId: string) {
    setPrinter(printerId);
    setMaterial(undefined);
    setNozzle(undefined);
    setNozzleMessage(undefined);
  }

  // Load which materials are available whenever the printer changes.
  useEffect(() => {
    if (!printer) {
      setDisabledMaterials([]);
      return;
    }
    let cancelled = false;
    void Promise.all(MATERIALS.map(m => isMaterialAvailable(printer, m.id))).then(results => {
      if (cancelled) return;
      setDisabledMaterials(
        MATERIALS.filter((_, i) => !results[i]).map(m => m.id),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [printer]);

  // Check whether the selected printer+material+nozzle combo has any validated profile.
  useEffect(() => {
    if (!printer || !material || !nozzle) {
      setNozzleMessage(undefined);
      return;
    }
    let cancelled = false;
    void isNozzleAvailable(printer, material, nozzle).then(available => {
      if (cancelled) return;
      if (!available) {
        const label = NOZZLE_SIZES.find(n => n.id === nozzle)?.label ?? nozzle;
        setNozzleMessage(
          `We haven't validated a ${label} profile for this combination yet.`,
        );
      } else {
        setNozzleMessage(undefined);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [printer, material, nozzle]);

  const isComplete = Boolean(printer && material && nozzle && goal);
  const canGenerate = isComplete && !nozzleMessage;

  return (
    <form
      onSubmit={e => e.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <PrinterSelector value={printer} onChange={handlePrinterChange} />
      <MaterialSelector
        value={material}
        onChange={setMaterial}
        disabledIds={disabledMaterials}
      />
      <div>
        <NozzleSelector value={nozzle} onChange={setNozzle} />
        {nozzleMessage && (
          <p
            role="alert"
            style={{ marginTop: '0.5rem', color: '#c00', fontSize: '0.875rem' }}
          >
            {nozzleMessage}
          </p>
        )}
      </div>
      <GoalSelector value={goal} onChange={setGoal} />
      <div>
        <button
          type="submit"
          disabled={!canGenerate}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            backgroundColor: canGenerate ? '#111' : '#ccc',
            color: canGenerate ? '#fff' : '#666',
          }}
        >
          Generate profile
        </button>
      </div>
    </form>
  );
}
