import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedSelector } from './SegmentedSelector';

const OPTIONS = [
  { id: 'pla', label: 'PLA' },
  { id: 'petg', label: 'PETG' },
  { id: 'tpu', label: 'TPU (95A)' },
] as const;

describe('SegmentedSelector', () => {
  it('renders the legend', () => {
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value={undefined} onChange={vi.fn()} />,
    );
    expect(screen.getByText('Material')).toBeInTheDocument();
  });

  it('renders a radio button for each option', () => {
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value={undefined} onChange={vi.fn()} />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('checks the radio matching the value prop', () => {
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value="petg" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: 'PETG' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'PLA' })).not.toBeChecked();
  });

  it('calls onChange with the option id when an unselected option is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value="pla" onChange={handleChange} />,
    );

    await user.click(screen.getByRole('radio', { name: 'PETG' }));

    expect(handleChange).toHaveBeenCalledExactlyOnceWith('petg');
  });

  it('does not call onChange when the already-selected option is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value="pla" onChange={handleChange} />,
    );

    await user.click(screen.getByRole('radio', { name: 'PLA' }));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders with no option selected when value is undefined', () => {
    render(
      <SegmentedSelector legend="Material" options={OPTIONS} value={undefined} onChange={vi.fn()} />,
    );
    screen.getAllByRole('radio').forEach(radio => {
      expect(radio).not.toBeChecked();
    });
  });
});
