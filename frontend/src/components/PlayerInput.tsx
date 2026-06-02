import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { PLAYER_SUGGESTIONS } from "@/data/players";

interface PlayerInputProps {
  selected: string[];
  onChange: (players: string[]) => void;
  suggestions?: string[];
  onSearch?: (q: string, signal: AbortSignal) => Promise<string[]>;
}

export function PlayerInput({
  selected,
  onChange,
  suggestions,
  onSearch,
}: PlayerInputProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const curated = suggestions?.length ? suggestions : PLAYER_SUGGESTIONS;
  const shouldSearch = input.trim().length >= 2;

  useEffect(() => {
    if (!onSearch || !shouldSearch) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      onSearch(input.trim(), controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setSearchResults(results);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSearchResults(null);
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, onSearch, shouldSearch]);

  const dropdownItems = useMemo(() => {
    if (!showDropdown || !shouldSearch) return [];
    if (searchResults !== null) {
      return searchResults.filter((p) => !selectedSet.has(p));
    }
    // fallback: local filter from curated list
    return curated
      .filter(
        (p) =>
          p.toLowerCase().includes(input.toLowerCase()) && !selectedSet.has(p),
      )
      .slice(0, 8);
  }, [showDropdown, shouldSearch, searchResults, selectedSet, curated, input]);

  const suggestionChips = useMemo(
    () => curated.filter((p) => !selectedSet.has(p)),
    [curated, selectedSet],
  );

  const add = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !selectedSet.has(trimmed)) {
        onChange([...selected, trimmed]);
      }
      setInput("");
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [selected, selectedSet, onChange],
  );

  function remove(name: string) {
    onChange(selected.filter((p) => p !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input.replace(/,/g, ""));
    } else if (e.key === "Backspace" && !input && selected.length > 0) {
      remove(selected[selected.length - 1]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="relative min-h-[64px] cursor-text rounded-2xl border border-border bg-[color:var(--surface-medium)] p-2.5 focus-within:border-primary/60 focus-within:bg-[color:var(--surface-strong)] focus-within:ring-2 focus-within:ring-primary/20"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1.5">
          {selected.map((player) => (
            <span
              key={player}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-[color:var(--primary-soft)] px-2.5 py-1 text-[13px] text-foreground"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--secondary)" }}
              />
              {player}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(player);
                }}
                className="ml-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label={`Quitar ${player}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value.replace(/,/g, ""));
              setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder={
              selected.length === 0 ? "Lionel Messi, Kylian Mbappé…" : ""
            }
            className="min-w-[140px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
          />
        </div>

        {showDropdown && (isSearching || dropdownItems.length > 0) && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-2 max-h-52 overflow-y-auto rounded-2xl border border-border bg-popover py-1">
            {isSearching && dropdownItems.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Buscando…
              </li>
            ) : (
              dropdownItems.map((player) => (
                <li key={player}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(player);
                    }}
                    className="w-full cursor-pointer px-3 py-2 text-left text-sm text-popover-foreground/90 hover:bg-[color:var(--surface-strong)]"
                  >
                    {player}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Sugerencias
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestionChips.map((player) => (
            <button
              key={player}
              type="button"
              onClick={() => add(player)}
              className="cursor-pointer rounded-full border border-dashed border-border bg-transparent px-2.5 py-1 text-[13px] text-muted-foreground transition-colors hover:border-secondary/50 hover:bg-secondary/10 hover:text-foreground"
            >
              {player}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
