import { useEffect, useMemo, useRef, useState } from 'react';

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  emptyText?: string;
};

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  emptyText = 'Không tìm thấy lựa chọn phù hợp',
}: SearchableSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const filtered = useMemo(
    () => options.filter((option) => `${option.label} ${option.keywords ?? ''}`.toLocaleLowerCase('vi').includes(normalizedQuery)),
    [normalizedQuery, options],
  );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setQuery('');
  }, [open]);

  return (
    <div className="searchable-select" ref={rootRef}>
      <button
        className="form-input searchable-select-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? '' : 'text-muted'}>{selected?.label ?? placeholder}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" value={value} required onChange={() => undefined} className="searchable-select-required" />}
      {open && (
        <div className="searchable-select-panel">
          <input
            ref={searchRef}
            className="form-input searchable-select-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            placeholder="Nhập để tìm kiếm..."
          />
          <div className="searchable-select-options" role="listbox">
            {filtered.length === 0 ? (
              <div className="searchable-select-empty">{emptyText}</div>
            ) : filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`searchable-select-option${option.value === value ? ' is-selected' : ''}`}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
