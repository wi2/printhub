import { MATERIALS } from '../../types';
import { SegmentedSelector } from '../../shared/SegmentedSelector';

type MaterialSelectorProps = {
  value: string | undefined;
  onChange: (materialId: string) => void;
};

const MATERIAL_OPTIONS = MATERIALS.map(m => ({ id: m.id, label: m.name }));

/** Binds the generic SegmentedSelector to the MATERIALS constant. */
export function MaterialSelector({ value, onChange }: MaterialSelectorProps) {
  return (
    <SegmentedSelector
      legend="Material"
      options={MATERIAL_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
