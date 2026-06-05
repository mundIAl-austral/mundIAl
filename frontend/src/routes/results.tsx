import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, MessageCircle, Trophy } from "lucide-react";
import { MatchRow } from "@/components/MatchRow";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { MatchRecommendation, RecommendationResponse } from "@/types";
import { getStoredRecommendations } from "@/utils/recommendationsStorage";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
});

interface Category {
  key: keyof RecommendationResponse;
  label: string;
  icon: string;
  color: string;
  soft: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    key: "imperdible",
    label: "Imperdible",
    icon: "01",
    color: "var(--secondary)",
    soft: "var(--secondary-soft)",
    description: "Cruces que merecen frenar todo y sentarse a verlos.",
  },
  {
    key: "vale_la_pena",
    label: "Vale la pena",
    icon: "02",
    color: "var(--chart-3)",
    soft: "rgba(255, 209, 102, 0.12)",
    description: "Partidos interesantes si tenés una ventana libre.",
  },
  {
    key: "para_el_resumen",
    label: "Para el resumen",
    icon: "03",
    color: "var(--primary)",
    soft: "var(--primary-soft)",
    description: "Mejor seguir highlights y quedarte con lo importante.",
  },
];

function SectionHeader({
  category,
  count,
  open,
}: {
  category: Category;
  count: number;
  open: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border font-mono text-[12px] tracking-[0.24em]"
        style={{ backgroundColor: category.soft, color: category.color }}
      >
        {category.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl leading-tight text-foreground">
            {category.label}
          </h2>
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em]"
            style={{ backgroundColor: category.soft, color: category.color }}
          >
            {count} partidos
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {category.description}
        </p>
      </div>
      <ChevronDown
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </div>
  );
}

function ResultsPage() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    return getStoredRecommendations();
  }, []);

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["imperdible", "vale_la_pena"]),
  );

  useEffect(() => {
    if (!data) {
      void navigate({ to: "/" });
    }
  }, [data, navigate]);

  if (!data) return null;

  const total =
    data.imperdible.length +
    data.vale_la_pena.length +
    data.para_el_resumen.length;

  function toggleSection(key: string) {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        rightSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: "/" })}
            className="gap-1.5 rounded-full border-border bg-[color:var(--surface-soft)] px-4 text-muted-foreground hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Editar perfil
          </Button>
        }
      />

      <main className="px-5 pb-12">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="px-1 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <h1 className="text-2xl leading-tight text-foreground md:text-3xl">
                Clasificamos {total} partidos para vos.
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Priorizamos tus mejores cruces en función de afinidad, contexto y
              disponibilidad horaria.
            </p>
          </div>

          <section className="space-y-3">
            {CATEGORIES.map((category) => {
              const matches = data[category.key];
              const isOpen = openSections.has(category.key);

              return (
                <div
                  key={category.key}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleSection(category.key)}
                  >
                    <CollapsibleTrigger className="w-full cursor-pointer text-left">
                      <SectionHeader
                        category={category}
                        count={matches.length}
                        open={isOpen}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border">
                        {matches.length === 0 ? (
                          <p className="px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5">
                            No hay partidos en esta categoría.
                          </p>
                        ) : (
                          <div className="divide-y divide-border">
                            {matches.map((match: MatchRecommendation) => (
                              <MatchRow
                                key={match.match_id}
                                match={match}
                                onClick={() =>
                                  void navigate({
                                    to: "/matches/$matchId",
                                    params: { matchId: match.match_id },
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-5 py-3">
          <Button
            variant="outline"
            className="h-12 shrink-0 gap-2 rounded-2xl rounded-tl-xs px-4 text-muted-foreground hover:text-foreground"
            onClick={() => void navigate({ to: "/chat" })}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-2xl rounded-tl-xs text-muted-foreground hover:text-foreground"
            onClick={() => void navigate({ to: "/setup", search: { step: 1 } })}
          >
            Ajustar perfil y recalcular
          </Button>
        </div>
      </div>
    </div>
  );
}
