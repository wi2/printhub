import { NOZZLE_SIZES } from '../../types';
import { SegmentedSelector } from '../../shared/SegmentedSelector';

type NozzleSelectorProps = {
  value: string | undefined;
  onChange: (nozzleId: string) => void;
};

const NOZZLE_OPTIONS = NOZZLE_SIZES.map(n => ({ id: n.id, label: n.label }));

/** Binds the generic SegmentedSelector to the NOZZLE_SIZES constant. */
export function NozzleSelector({ value, onChange }: NozzleSelectorProps) {
  return (
    <SegmentedSelector
      legend="Nozzle Size"
      options={NOZZLE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
