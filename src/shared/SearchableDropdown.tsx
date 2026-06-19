import { useState, useRef, useEffect, useId } from 'react';

type DropdownItem = {
  id: string;
  label: string;
};

type SearchableDropdownProps = {
  /** Items to display. Zero domain knowledge — receives plain id+label pairs. */
  items: readonly DropdownItem[];
  /** The id of the currently selected item, or undefined for no selection. */
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Visible label text rendered above the input. */
  label: string;
};

/**
 * Generic searchable dropdown. Zero domain knowledge — receives items as data.
 * Typing in the input filters the list. Clicking an item selects it.
 * Click-outside closes the dropdown and restores the selected label.
 */
export function SearchableDropdown({
  items,
  value,
  onChange,
  placeholder = 'Search…',
  label,
}: SearchableDropdownProps) {
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find(item => item.id === value);

  const filteredItems = query
    ? items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Close when the user clicks outside the component.
  // Uses mousedown so it fires before the click event on the list item.
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(true);
  }

  function handleFocus() {
    setIsOpen(true);
  }

  function handleSelect(item: DropdownItem) {
    onChange(item.id);
    setIsOpen(false);
    setQuery('');
  }

  // When open: show the live search query so the user can type to filter.
  // When closed: show the selected item label (empty string if nothing selected).
  const inputValue = isOpen ? query : (selectedItem?.label ?? '');

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label
        htmlFor={inputId}
        style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxSizing: 'border-box',
          fontSize: 'inherit',
        }}
      />
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            border: '1px solid #ccc',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            backgroundColor: '#fff',
            zIndex: 10,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <li
                key={item.id}
                role="option"
                aria-selected={item.id === value}
                // onMouseDown fires before the input's onBlur, preventing
                // the dropdown from closing before the selection registers.
                onMouseDown={() => handleSelect(item)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: item.id === value ? '#f0f0f0' : '#fff',
                }}
              >
                {item.label}
              </li>
            ))
          ) : (
            <li style={{ padding: '0.5rem', color: '#999' }}>No results</li>
          )}
        </ul>
      )}
    </div>
  );
}
