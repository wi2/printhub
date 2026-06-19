import { PRINTERS } from '../../types';
import { SearchableDropdown } from '../../shared/SearchableDropdown';

type PrinterSelectorProps = {
  value: string | undefined;
  onChange: (printerId: string) => void;
};

const PRINTER_ITEMS = PRINTERS.map(p => ({ id: p.id, label: p.name }));

/** Binds the generic SearchableDropdown to the PRINTERS constant. */
export function PrinterSelector({ value, onChange }: PrinterSelectorProps) {
  return (
    <SearchableDropdown
      label="Printer"
      items={PRINTER_ITEMS}
      value={value}
      onChange={onChange}
      placeholder="Search printers…"
    />
  );
}
