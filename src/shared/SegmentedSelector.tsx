import { useId } from 'react';

type SegmentedOption = {
  id: string;
  label: string;
};

// Omit native onChange — fieldset's ChangeEvent<HTMLFieldSetElement> would conflict
// with our domain-specific (id: string) => void signature.
type SegmentedSelectorProps = Omit<React.ComponentPropsWithoutRef<'fieldset'>, 'onChange'> & {
  /** Each option must have a unique id and a display label. */
  options: readonly SegmentedOption[];
  /** The id of the currently selected option, or undefined for no selection. */
  value: string | undefined;
  onChange: (id: string) => void;
  /** Used as the <legend> text and as the accessible group name. */
  legend: string;
};

/**
 * Generic segmented radio group. Zero domain knowledge — receives options as data.
 * Renders as a <fieldset>/<legend> for accessible keyboard navigation.
 * Domain labels are applied by the caller (e.g. MaterialSelector).
 */
export function SegmentedSelector({
  options,
  value,
  onChange,
  legend,
  style,
  ...rest
}: SegmentedSelectorProps) {
  const groupName = useId();

  return (
    <fieldset
      style={{ border: 'none', padding: 0, margin: 0, ...style }}
      {...rest}
    >
      <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{legend}</legend>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {options.map(option => {
          const isSelected = option.id === value;
          return (
            <label
              key={option.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                border: `1px solid ${isSelected ? '#111' : '#ccc'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400,
                backgroundColor: isSelected ? '#f0f0f0' : '#fff',
                userSelect: 'none',
              }}
            >
              {/* sr-only: accessible but not visible — label handles interaction */}
              <input
                type="radio"
                name={groupName}
                value={option.id}
                checked={isSelected}
                onChange={() => onChange(option.id)}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
