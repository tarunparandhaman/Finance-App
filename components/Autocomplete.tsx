"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";

export interface AutocompleteOption {
  key: string;
  label: string;
  sublabel?: string;
}

export default function Autocomplete({
  placeholder,
  onSearch,
  onSelect,
  minChars = 2,
}: {
  placeholder: string;
  onSearch: (query: string) => Promise<AutocompleteOption[]>;
  onSelect: (option: AutocompleteOption) => void;
  minChars?: number;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < minChars) {
      setOptions([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await onSearch(query.trim());
      setOptions(results);
      setLoading(false);
      setOpen(true);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onSelect(opt);
                setQuery(opt.label);
                setOpen(false);
              }}
              className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-background"
            >
              <div className="font-medium">{opt.label}</div>
              {opt.sublabel && <div className="text-xs text-muted">{opt.sublabel}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
