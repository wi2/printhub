import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRINTERS, MATERIALS, NOZZLE_SIZES, isGoalSelectable } from '../../types';
import { isAvailable, isMaterialAvailable, isNozzleAvailable } from './availability';
import { buildSlug } from '../../lib/slug';
import { parseConfigureParams } from '../../lib/url-params';
import { PrinterSelector } from './PrinterSelector';
import { MaterialSelector } from './MaterialSelector';
import { NozzleSelector } from './NozzleSelector';
import { GoalSelector } from './GoalSelector';

const SUBMIT_DELAY_MS = 800;

/**
 * Owns the complete selection state for all four combination inputs.
 *
 * S-3.3: loads material availability for the selected printer; shows a
 * message when the printer+material+nozzle combo has no validated profile.
 *
 * S-3.4: on submit, verifies the full combination exists in the manifest,
 * applies an 800ms delay, then navigates to /profile/[slug]. Shows an
 * inline error if the combination is not in the manifest.
 *
 * S-3.9: pre-fills inputs from URL query params on mount via parseConfigureParams.
 */
export function CombinationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [printer, setPrinter] = useState<string | undefined>(undefined);
  const [material, setMaterial] = useState<string | undefined>(undefined);
  const [nozzle, setNozzle] = useState<string | undefined>(undefined);
  const [goal, setGoal] = useState<string | undefined>(undefined);

  const [disabledMaterials, setDisabledMaterials] = useState<readonly string[]>([]);
  const [nozzleMessage, setNozzleMessage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const prefilled = parseConfigureParams(searchParams);
    if (prefilled.printer !== undefined) setPrinter(prefilled.printer);
    if (prefilled.material !== undefined) setMaterial(prefilled.material);
    if (prefilled.nozzle !== undefined) setNozzle(prefilled.nozzle);
    if (prefilled.goal !== undefined) setGoal(prefilled.goal);
  }, [searchParams]);

  // Derived — Bambu printers → 'bambu-orca', Prusa/Creality → 'prusaslicer'.
  // Not shown to users; consumed in S-3.7.
  const slicerFormat = printer
    ? PRINTERS.find(p => p.id === printer)?.defaultSlicerFormat
    : undefined;
  void slicerFormat;

  function handlePrinterChange(printerId: string) {
    setPrinter(printerId);
    setMaterial(undefined);
    setNozzle(undefined);
    setNozzleMessage(undefined);
    setSubmitError(undefined);
  }

  useEffect(() => {
    if (!printer) {
      setDisabledMaterials([]);
      return;
    }
    let cancelled = false;
    void Promise.all(MATERIALS.map(m => isMaterialAvailable(printer, m.id))).then(results => {
      if (cancelled) return;
      setDisabledMaterials(MATERIALS.filter((_, i) => !results[i]).map(m => m.id));
    });
    return () => { cancelled = true; };
  }, [printer]);

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
    return () => { cancelled = true; };
  }, [printer, material, nozzle]);

  const isComplete = Boolean(printer && material && nozzle && goal && isGoalSelectable(goal));
  const canGenerate = isComplete && !nozzleMessage;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!printer || !material || !nozzle || !goal || !canGenerate) return;

    setIsSubmitting(true);
    setSubmitError(undefined);

    // Verify the exact 4-way combination exists AND enforce the minimum delay
    // so the transition is not jarring (AC: minimum 800ms).
    const [exists] = await Promise.all([
      isAvailable(printer, material, nozzle, goal),
      new Promise<void>(resolve => setTimeout(resolve, SUBMIT_DELAY_MS)),
    ]);

    if (!exists) {
      setSubmitError(
        "We don't have a validated profile for this exact combination. Please try a different selection.",
      );
      setIsSubmitting(false);
      return;
    }

    navigate(`/profile/${buildSlug(printer, material, nozzle, goal)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* fieldset[disabled] locks all form controls inside during submission */}
      <fieldset
        disabled={isSubmitting}
        style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}
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
            <p role="alert" style={{ marginTop: '0.5rem', color: '#c00', fontSize: '0.875rem' }}>
              {nozzleMessage}
            </p>
          )}
        </div>
        <GoalSelector value={goal} onChange={setGoal} />
      </fieldset>
      <div>
        <button
          type="submit"
          disabled={!canGenerate || isSubmitting}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            cursor: canGenerate && !isSubmitting ? 'pointer' : 'not-allowed',
            backgroundColor: canGenerate && !isSubmitting ? '#111' : '#ccc',
            color: canGenerate && !isSubmitting ? '#fff' : '#666',
          }}
        >
          {isSubmitting ? 'Generating…' : 'Generate profile'}
        </button>
        {submitError && (
          <p role="alert" style={{ marginTop: '0.5rem', color: '#c00', fontSize: '0.875rem' }}>
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
}
