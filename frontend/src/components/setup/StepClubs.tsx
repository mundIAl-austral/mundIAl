import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { getClubs } from "@/api/clubs";
import { Input } from "@/components/ui/input";

interface StepClubsProps {
  selectedClubs: string[];
  onChange: (clubs: string[]) => void;
}

const PAGE_SIZE = 20;

export function StepClubs({ selectedClubs, onChange }: StepClubsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced server-side prefix search (paginated, first page).
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const timer = setTimeout(() => {
      getClubs(inputValue.trim(), PAGE_SIZE, 0, controller.signal)
        .then((r) => {
          if (!controller.signal.aborted) {
            setResults(r.clubs);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue]);

  const filteredClubs = results.filter((club) => !selectedClubs.includes(club));

  const handleSelectClub = (club: string) => {
    onChange([...selectedClubs, club]);
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemoveClub = (club: string) => {
    onChange(selectedClubs.filter((c) => c !== club));
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <div className="relative">
          <Input
            placeholder="Buscá un club..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {isLoading && filteredClubs.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Buscando…
              </div>
            ) : filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <button
                  key={club}
                  type="button"
                  onClick={() => handleSelectClub(club)}
                  className="w-full px-4 py-2 text-left hover:bg-[color:var(--surface-medium)] transition-colors"
                >
                  {club}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Sin resultados
              </div>
            )}
          </div>
        )}
      </div>

      {selectedClubs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClubs.map((club) => (
            <div
              key={club}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {club}
              <button
                type="button"
                onClick={() => handleRemoveClub(club)}
                className="ml-1 hover:opacity-75"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedClubs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Podés seleccionar tus equipos de clubs favoritos. Las recomendaciones
          incluirán partidos con naciones que juegen similar a tus clubes
          favoritos.
        </p>
      )}
    </div>
  );
}
