import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableDropdown } from './SearchableDropdown';

const ITEMS = [
  { id: 'bambu-a1-mini', label: 'Bambu Lab A1 Mini' },
  { id: 'bambu-x1c', label: 'Bambu Lab X1C' },
  { id: 'prusa-mk4', label: 'Prusa MK4' },
  { id: 'creality-ender', label: 'Creality Ender 3 V3 SE' },
  { id: 'creality-k1', label: 'Creality K1' },
] as const;

describe('SearchableDropdown', () => {
  it('renders a labelled text input', () => {
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('Printer')).toBeInTheDocument();
  });

  it('shows the selected item label in the input when closed', () => {
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value="prusa-mk4" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toHaveValue('Prusa MK4');
  });

  it('opens the dropdown and shows all items when the input is focused', async () => {
    const user = userEvent.setup();
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(ITEMS.length);
  });

  it('filters items when the user types in the input', async () => {
    const user = userEvent.setup();
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'bambu');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Bambu Lab A1 Mini');
    expect(options[1]).toHaveTextContent('Bambu Lab X1C');
  });

  it('shows "No results" when the search query matches nothing', async () => {
    const user = userEvent.setup();
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'zzz');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('calls onChange with the item id when an item is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={handleChange} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));

    expect(handleChange).toHaveBeenCalledExactlyOnceWith('prusa-mk4');
  });

  it('closes the dropdown and shows the selected label after selection', async () => {
    const user = userEvent.setup();
    render(
      <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Prusa MK4' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown when the user clicks outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchableDropdown label="Printer" items={ITEMS} value={undefined} onChange={vi.fn()} />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
