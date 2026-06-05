import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { fetchRecommendations, getPreview } from "@/api/recommendations";
import { MatchRow } from "@/components/MatchRow";
import { NavBar } from "@/components/NavBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import type { FeedbackItem, UserProfile } from "@/types";
import { storeRecommendations } from "@/utils/recommendationsStorage";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

function previewKey(profile: UserProfile): string {
  // Stable key: changes when the profile inputs change, without hashing the
  // full (large) ICS payload on every render.
  return JSON.stringify({
    t: profile.favorite_teams,
    p: profile.favorite_players,
    tz: profile.timezone,
    c: profile.country,
    ics: profile.ics_content.length,
  });
}

function FeedbackPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // ratings: match_id → liked (true/false). Absent = not rated yet.
  const [ratings, setRatings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile) void navigate({ to: "/" });
  }, [profile, navigate]);

  const {
    data: preview,
    isPending: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    refetch,
  } = useQuery({
    queryKey: ["preview", profile ? previewKey(profile) : "none"],
    queryFn: () => getPreview(profile as UserProfile),
    enabled: !!profile,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const submit = useMutation({
    mutationFn: (feedback?: FeedbackItem[]) =>
      fetchRecommendations(profile as UserProfile, feedback),
    onSuccess: (data) => {
      storeRecommendations(data);
      void navigate({ to: "/results" });
    },
  });

  if (!profile) return null;

  const matches = preview?.matches ?? [];
  const ratedCount = Object.keys(ratings).length;
  const allRated = matches.length > 0 && ratedCount === matches.length;

  function rate(matchId: string, liked: boolean) {
    setRatings((prev) => ({ ...prev, [matchId]: liked }));
  }

  function handleSubmit() {
    const feedback: FeedbackItem[] = Object.entries(ratings).map(
      ([match_id, liked]) => ({ match_id, liked }),
    );
    submit.mutate(feedback.length > 0 ? feedback : undefined);
  }

  function handleSkip() {
    submit.mutate(undefined);
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
            Volver
          </Button>
        }
      />

      <main className="px-5 pb-36">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="px-1 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl leading-tight text-foreground md:text-3xl">
                Ayudanos a afinar tus recomendaciones.
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Marcá si verías o no estos partidos. Ajustamos el modelo a tu
              gusto antes de clasificar los 72 partidos.
            </p>
          </div>

          {isPreviewError && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos cargar los partidos</AlertTitle>
              <AlertDescription className="mt-1">
                {previewError instanceof Error
                  ? previewError.message
                  : "Error desconocido"}
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="ml-2 underline"
                >
                  Reintentar
                </button>
              </AlertDescription>
            </Alert>
          )}

          {submit.isError && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos generar recomendaciones</AlertTitle>
              <AlertDescription className="mt-1">
                {submit.error instanceof Error
                  ? submit.error.message
                  : "Error desconocido"}
              </AlertDescription>
            </Alert>
          )}

          {isPreviewLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <section className="space-y-3">
              {matches.map((match) => {
                const rating = ratings[match.match_id];
                return (
                  <div
                    key={match.match_id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <MatchRow match={match} />
                    <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
                      <Button
                        variant="outline"
                        onClick={() => rate(match.match_id, true)}
                        className={
                          rating === true
                            ? "h-11 gap-2 rounded-xl border-[color:var(--secondary)] bg-[color:var(--secondary-soft)] text-[color:var(--secondary)]"
                            : "h-11 gap-2 rounded-xl border-border bg-[color:var(--surface-soft)] text-muted-foreground hover:text-foreground"
                        }
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Lo veo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rate(match.match_id, false)}
                        className={
                          rating === false
                            ? "h-11 gap-2 rounded-xl border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                            : "h-11 gap-2 rounded-xl border-border bg-[color:var(--surface-soft)] text-muted-foreground hover:text-foreground"
                        }
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Paso
                      </Button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-5 py-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={submit.isPending}
            className="h-12 rounded-2xl border-border bg-card px-5 text-foreground/80 hover:bg-[color:var(--surface-elevated-hover)] hover:text-foreground"
          >
            Omitir
          </Button>
          {submit.isPending ? (
            <Skeleton className="h-12 flex-1 rounded-2xl" />
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allRated}
              className="h-12 flex-1 gap-2 rounded-2xl rounded-tl-xs"
              size="lg"
            >
              {allRated
                ? "Ver mis recomendaciones"
                : `Calificá los ${matches.length} partidos (${ratedCount}/${matches.length})`}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
