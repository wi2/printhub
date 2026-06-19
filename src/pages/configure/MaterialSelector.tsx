import { MATERIALS } from '../../types';
import { SegmentedSelector } from '../../shared/SegmentedSelector';

type MaterialSelectorProps = {
  value: string | undefined;
  onChange: (materialId: string) => void;
  /** Material ids that are unavailable for the current printer and should be greyed. */
  disabledIds?: readonly string[];
};

const MATERIAL_OPTIONS = MATERIALS.map(m => ({ id: m.id, label: m.name }));

/** Binds the generic SegmentedSelector to the MATERIALS constant. */
export function MaterialSelector({ value, onChange, disabledIds }: MaterialSelectorProps) {
  return (
    <SegmentedSelector
      legend="Material"
      options={MATERIAL_OPTIONS}
      value={value}
      onChange={onChange}
      disabledIds={disabledIds}
    />
  );
}
