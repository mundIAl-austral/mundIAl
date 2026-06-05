import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  animate,
  createDraggable,
  createScope,
  spring,
  type Draggable,
  type Scope,
} from "animejs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  HelpCircle,
  type LucideIcon,
  Sparkles,
  X,
} from "lucide-react";
import { fetchRecommendations, getPreview } from "@/api/recommendations";
import { Flag } from "@/components/Flag";
import { NavBar } from "@/components/NavBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import type {
  FeedbackItem,
  FeedbackPreference,
  MatchRecommendation,
  UserProfile,
} from "@/types";
import { TEAM_COUNTRY_CODES, TEAM_META } from "@/data/teams";
import { storeRecommendations } from "@/utils/recommendationsStorage";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

const SWIPE_RIGHT = 96;
const SWIPE_LEFT = -96;
const SWIPE_UP = -88;
const DECK_CARD_TOP = 64;

const PREFERENCE_META: Record<
  FeedbackPreference,
  {
    label: string;
    icon: LucideIcon;
    pillClass: string;
    exit: { x: number; y: number; rotate: number };
  }
> = {
  paso: {
    label: "Paso",
    icon: X,
    pillClass:
      "border-[color:var(--secondary)] bg-[color:var(--secondary-soft)] text-[color:var(--secondary)]",
    exit: { x: -420, y: 28, rotate: -18 },
  },
  tal_vez: {
    label: "Tal vez",
    icon: HelpCircle,
    pillClass:
      "border-[color:var(--chart-3)] bg-[color:var(--surface-medium)] text-[color:var(--chart-3)]",
    exit: { x: 0, y: -420, rotate: 0 },
  },
  lo_veo: {
    label: "Lo veo",
    icon: Check,
    pillClass:
      "border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
    exit: { x: 420, y: 28, rotate: 18 },
  },
};

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function preferenceFromPosition(
  x: number,
  y: number,
): FeedbackPreference | null {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (x >= SWIPE_RIGHT && absX >= absY) return "lo_veo";
  if (x <= SWIPE_LEFT && absX >= absY) return "paso";
  if (y <= SWIPE_UP && absY > absX) return "tal_vez";
  return null;
}

function FeedbackPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const scopeRef = useRef<Scope | null>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const isAnimatingRef = useRef(false);
  const dragHintRef = useRef<FeedbackPreference | null>(null);
  const autoSubmitRef = useRef(false);

  const [ratings, setRatings] = useState<Record<string, FeedbackPreference>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragHint, setDragHint] = useState<FeedbackPreference | null>(null);

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

  const matches = useMemo(() => preview?.matches ?? [], [preview?.matches]);
  const activeMatch = matches[activeIndex];
  const ratedCount = Object.keys(ratings).length;
  const allRated = matches.length > 0 && ratedCount === matches.length;
  const progressPct = matches.length > 0 ? (ratedCount / matches.length) * 100 : 0;
  const feedbackItems = useMemo<FeedbackItem[]>(
    () =>
      Object.entries(ratings).map(([match_id, preference]) => ({
        match_id,
        preference,
      })),
    [ratings],
  );

  const resetDragHint = useCallback(() => {
    dragHintRef.current = null;
    setDragHint(null);
  }, []);

  const commitPreference = useCallback(
    (preference: FeedbackPreference) => {
      if (!activeMatch) return;
      setRatings((prev) => ({
        ...prev,
        [activeMatch.match_id]: preference,
      }));
      setActiveIndex((prev) => prev + 1);
      resetDragHint();
      isAnimatingRef.current = false;
    },
    [activeMatch, resetDragHint],
  );

  const animateChoice = useCallback(
    (preference: FeedbackPreference) => {
      if (!activeMatch || isAnimatingRef.current) return;
      const card = cardRef.current;
      if (!card) {
        commitPreference(preference);
        return;
      }

      isAnimatingRef.current = true;
      draggableRef.current?.disable();
      const { exit } = PREFERENCE_META[preference];

      animate(card, {
        x: exit.x,
        y: exit.y,
        rotate: exit.rotate,
        opacity: 1,
        scale: 0.94,
        duration: 260,
        ease: "in(3)",
        onComplete: () => commitPreference(preference),
      });
    },
    [activeMatch, commitPreference],
  );

  useEffect(() => {
    if (!activeMatch || !rootRef.current || !cardRef.current) return;

    isAnimatingRef.current = false;
    resetDragHint();

    const card = cardRef.current;
    card.style.rotate = "0deg";
    scopeRef.current?.revert();
    scopeRef.current = createScope({ root: rootRef }).add(() => {
      animate(card, {
        x: 0,
        y: 0,
        rotate: 0,
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 260,
        ease: "out(3)",
      });

      draggableRef.current = createDraggable(card, {
        x: true,
        y: true,
        cursor: { onHover: "grab", onGrab: "grabbing" },
        releaseEase: spring({ bounce: 0.35 }),
        onUpdate: (self) => {
          const nextHint = preferenceFromPosition(self.x, self.y);
          card.style.rotate = `${clamp(self.x / 14, -16, 16)}deg`;
          if (dragHintRef.current !== nextHint) {
            dragHintRef.current = nextHint;
            setDragHint(nextHint);
          }
        },
        onRelease: (self) => {
          const preference = preferenceFromPosition(self.x, self.y);
          if (preference) {
            animateChoice(preference);
            return;
          }

          animate(card, {
            x: 0,
            y: 0,
            rotate: 0,
            duration: 320,
            ease: spring({ bounce: 0.35 }),
            onComplete: () => {
              card.style.rotate = "0deg";
              self.setX(0, true);
              self.setY(0, true);
              resetDragHint();
            },
          });
        },
      });
    });

    return () => {
      draggableRef.current = null;
      scopeRef.current?.revert();
      scopeRef.current = null;
    };
  }, [activeMatch, animateChoice, resetDragHint]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (!activeMatch || submit.isPending) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        animateChoice("paso");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        animateChoice("lo_veo");
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        animateChoice("tal_vez");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMatch, animateChoice, submit.isPending]);

  useEffect(() => {
    if (!allRated || submit.isPending || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    submit.mutate(feedbackItems);
  }, [allRated, feedbackItems, submit]);

  if (!profile) return null;

  function handleSubmit() {
    submit.mutate(feedbackItems.length > 0 ? feedbackItems : undefined);
  }

  function handleSkip() {
    submit.mutate(undefined);
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowUp") event.currentTarget.blur();
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

      <main className="px-5 pb-40">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="px-1 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl leading-tight text-foreground md:text-3xl">
                Afinemos tus recomendaciones.
              </h1>
            </div>
            <div className="mt-4 overflow-hidden rounded-full bg-[color:var(--surface-medium)]">
              <div
                className="h-1.5 rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>
                {ratedCount}/{matches.length || 5}
              </span>
              <span>Swipe</span>
            </div>
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

          {isPreviewLoading || submit.isPending ? (
            <FeedbackSkeleton />
          ) : (
            <SwipeDeck
              rootRef={rootRef}
              cardRef={cardRef}
              matches={matches}
              activeIndex={activeIndex}
              dragHint={dragHint}
            />
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-3">
          <div className="grid grid-cols-3 gap-2">
            <PreferenceButton
              preference="paso"
              onClick={() => animateChoice("paso")}
              onKeyDown={handleButtonKeyDown}
              disabled={!activeMatch || submit.isPending}
            />
            <PreferenceButton
              preference="tal_vez"
              onClick={() => animateChoice("tal_vez")}
              onKeyDown={handleButtonKeyDown}
              disabled={!activeMatch || submit.isPending}
            />
            <PreferenceButton
              preference="lo_veo"
              onClick={() => animateChoice("lo_veo")}
              onKeyDown={handleButtonKeyDown}
              disabled={!activeMatch || submit.isPending}
            />
          </div>

          <div className="flex min-h-12 items-center gap-3">
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
                  : `Elegí ${matches.length || 5} partidos (${ratedCount}/${matches.length || 5})`}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackSkeleton() {
  return (
    <section className="relative mx-auto h-[440px] max-w-2xl pt-6">
      <Skeleton className="absolute inset-x-8 top-10 h-[360px] rounded-2xl opacity-40" />
      <Skeleton className="absolute inset-x-4 top-6 h-[380px] rounded-2xl opacity-70" />
      <Skeleton className="relative h-[400px] rounded-2xl" />
    </section>
  );
}

function SwipeDeck({
  rootRef,
  cardRef,
  matches,
  activeIndex,
  dragHint,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
  matches: MatchRecommendation[];
  activeIndex: number;
  dragHint: FeedbackPreference | null;
}) {
  const visibleMatches = matches.slice(activeIndex, activeIndex + 3);
  const activeMatch = visibleMatches[0];

  if (!activeMatch) {
    return <FeedbackSkeleton />;
  }

  return (
    <section
      ref={rootRef}
      className="relative mx-auto h-[448px] max-w-2xl touch-pan-y pt-6"
    >
      {visibleMatches
        .slice()
        .reverse()
        .map((match, reverseIndex) => {
          const deckIndex = visibleMatches.length - 1 - reverseIndex;
          const isActive = deckIndex === 0;
          return (
            <MatchSwipeCard
              key={match.match_id}
              ref={isActive ? cardRef : undefined}
              match={match}
              deckIndex={deckIndex}
              isActive={isActive}
              dragHint={isActive ? dragHint : null}
            />
          );
        })}
    </section>
  );
}

const MatchSwipeCard = forwardRef<
  HTMLDivElement,
  {
  match: MatchRecommendation;
  deckIndex: number;
  isActive: boolean;
  dragHint: FeedbackPreference | null;
  }
>(function MatchSwipeCard(
  { match, deckIndex, isActive, dragHint },
  ref,
) {
  const offset = deckIndex * 14;
  const scale = 1 - deckIndex * 0.045;
  const opacity = 1 - deckIndex * 0.22;

  return (
    <div
      ref={ref}
      aria-label={
        isActive
          ? `${match.team_a} vs ${match.team_b}`
          : undefined
      }
      className={
        isActive
          ? "absolute inset-x-0 top-16 z-30 select-none px-0 will-change-transform"
          : "pointer-events-none absolute inset-x-3 z-10 select-none"
      }
      style={
        isActive
          ? undefined
          : {
              top: `${DECK_CARD_TOP + offset}px`,
              scale,
              opacity,
            }
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="relative">
          <SwipeBadge preference="paso" active={dragHint === "paso"} />
          <SwipeBadge preference="tal_vez" active={dragHint === "tal_vez"} />
          <SwipeBadge preference="lo_veo" active={dragHint === "lo_veo"} />
          <FeedbackMatchBody match={match} />
        </div>
      </div>
    </div>
  );
});

function FeedbackMatchBody({ match }: { match: MatchRecommendation }) {
  const teamAName = TEAM_META[match.team_a]?.es ?? match.team_a;
  const teamBName = TEAM_META[match.team_b]?.es ?? match.team_b;
  const teamACountryCode = TEAM_COUNTRY_CODES[match.team_a];
  const teamBCountryCode = TEAM_COUNTRY_CODES[match.team_b];

  return (
    <div className="flex min-h-[300px] flex-col justify-center gap-9 px-5 py-8 sm:min-h-[340px] sm:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-center gap-7">
          {teamACountryCode ? (
            <Flag
              countryCode={teamACountryCode}
              countryLabel={teamAName}
              size="lg"
              className="h-16 w-24 text-2xl sm:h-20 sm:w-28"
            />
          ) : null}
          <h2 className="break-words text-center text-xl font-semibold leading-tight text-foreground sm:text-3xl">
            {teamAName}
          </h2>
        </div>
        <div className="text-center font-mono text-3xl font-black uppercase leading-none tracking-normal text-foreground sm:text-4xl">
          vs
        </div>
        <div className="flex min-w-0 flex-col items-center gap-7">
          {teamBCountryCode ? (
            <Flag
              countryCode={teamBCountryCode}
              countryLabel={teamBName}
              size="lg"
              className="h-16 w-24 text-2xl sm:h-20 sm:w-28"
            />
          ) : null}
          <h2 className="break-words text-center text-xl font-semibold leading-tight text-foreground sm:text-3xl">
            {teamBName}
          </h2>
        </div>
      </div>
    </div>
  );
}

function SwipeBadge({
  preference,
  active,
}: {
  preference: FeedbackPreference;
  active: boolean;
}) {
  const meta = PREFERENCE_META[preference];
  const Icon = meta.icon;
  const position =
    preference === "paso"
      ? "right-4 top-4 rotate-6"
      : preference === "lo_veo"
        ? "left-4 top-4 -rotate-6"
        : "bottom-4 left-1/2 -translate-x-1/2";

  return (
    <div
      className={[
        "pointer-events-none absolute z-20 flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] shadow-lg transition-all duration-150",
        meta.pillClass,
        position,
        active ? "scale-100 opacity-100" : "scale-90 opacity-0",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </div>
  );
}

function PreferenceButton({
  preference,
  onClick,
  onKeyDown,
  disabled,
}: {
  preference: FeedbackPreference;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  disabled: boolean;
}) {
  const meta = PREFERENCE_META[preference];
  const Icon = meta.icon;
  const arrow =
    preference === "paso" ? (
      <ArrowLeft className="h-3.5 w-3.5" />
    ) : preference === "lo_veo" ? (
      <ArrowRight className="h-3.5 w-3.5" />
    ) : (
      <ArrowUp className="h-3.5 w-3.5" />
    );

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={[
        "h-12 gap-2 rounded-2xl px-2 text-xs font-semibold hover:brightness-105 sm:text-sm",
        meta.pillClass,
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      <span className="min-w-0 truncate">{meta.label}</span>
      <span className="hidden text-muted-foreground sm:inline-flex">{arrow}</span>
    </Button>
  );
}
