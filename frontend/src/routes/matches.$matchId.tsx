import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  MapPin,
} from "lucide-react";
import { Flag } from "@/components/Flag";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TEAM_COUNTRY_CODES, TEAM_META } from "@/data/teams";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import type { MatchPlayerDetail, MatchRecommendation, MatchTeamDetail } from "@/types";
import { getStoredRecommendation } from "@/utils/recommendationsStorage";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailPage,
});

const CATEGORY_META: Record<
  MatchRecommendation["category"],
  { label: string; color: string; soft: string }
> = {
  imperdible: {
    label: "Imperdible",
    color: "var(--secondary)",
    soft: "var(--secondary-soft)",
  },
  vale_la_pena: {
    label: "Vale la pena",
    color: "var(--chart-3)",
    soft: "rgba(255, 209, 102, 0.12)",
  },
  para_el_resumen: {
    label: "Para el resumen",
    color: "var(--primary)",
    soft: "var(--primary-soft)",
  },
};

const POSITION_LABELS: Record<string, string> = {
  GK: "Arqueros",
  DF: "Defensores",
  MF: "Mediocampistas",
  FW: "Delanteros",
};

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];

const ATTRIBUTE_LABELS: Record<string, string> = {
  pace: "RIT",
  shooting: "TIR",
  passing: "PAS",
  dribbling: "REG",
  defending: "DEF",
  physical: "FIS",
};

function formatMatchDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

function teamLabel(name: string): string {
  return TEAM_META[name]?.es ?? name;
}

function groupedPlayers(
  players: MatchPlayerDetail[],
): Array<[string, MatchPlayerDetail[]]> {
  const grouped = players.reduce<Record<string, MatchPlayerDetail[]>>(
    (acc, player) => {
      const key = player.squad_position || "OT";
      acc[key] = acc[key] ?? [];
      acc[key].push(player);
      return acc;
    },
    {},
  );

  const known = POSITION_ORDER.filter((position) => grouped[position]).map(
    (position) => [position, grouped[position]] as [string, MatchPlayerDetail[]],
  );
  const rest = Object.entries(grouped)
    .filter(([position]) => !POSITION_ORDER.includes(position))
    .sort(([a], [b]) => a.localeCompare(b));
  return [...known, ...rest];
}

function topAttributes(player: MatchPlayerDetail): Array<[string, number]> {
  const primary = Object.keys(ATTRIBUTE_LABELS)
    .filter((key) => typeof player.attributes[key] === "number")
    .map((key) => [key, player.attributes[key]] as [string, number]);

  if (primary.length > 0) return primary.slice(0, 6);

  return Object.entries(player.attributes)
    .filter(([, value]) => typeof value === "number")
    .slice(0, 4);
}

function PlayerRow({ player }: { player: MatchPlayerDetail }) {
  const attrs = topAttributes(player);
  const numberLabel =
    player.squad_number !== null
      ? String(player.squad_number).padStart(2, "0")
      : "--";

  return (
    <div className="flex items-start gap-3 border-t border-border px-3 py-3 first:border-t-0 sm:px-4">
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-[color:var(--surface-soft)]">
        <span className="font-heading text-lg leading-none text-foreground">
          {player.overall_rating}
        </span>
        <span className="font-mono text-[9px] leading-none text-muted-foreground">
          OVR
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              {numberLabel}
            </span>
            <h4 className="truncate text-sm font-semibold leading-tight text-foreground">
              {player.name}
            </h4>
            {player.is_captain ? (
              <Badge className="gap-1 rounded-full bg-[color:var(--secondary-soft)] px-2 py-0.5 text-[10px] text-[color:var(--secondary)]">
                <Crown className="h-3 w-3" />
                CAP
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
            {player.detailed_position ?? player.squad_position}
            {player.club ? ` · ${player.club}` : ""}
            {player.age ? ` · ${player.age} años` : ""}
          </p>
        </div>
      </div>

      {attrs.length > 0 ? (
        <div className="hidden max-w-56 flex-wrap justify-end gap-1.5 md:flex">
          {attrs.map(([key, value]) => (
            <span
              key={key}
              className="rounded-lg bg-[color:var(--surface-soft)] px-2 py-1 font-mono text-[10px] text-foreground/78"
            >
              {ATTRIBUTE_LABELS[key] ?? key.toUpperCase()} {value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SquadSection({ team }: { team: MatchTeamDetail }) {
  const countryCode = TEAM_COUNTRY_CODES[team.name];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {countryCode ? (
            <Flag
              countryCode={countryCode}
              countryLabel={teamLabel(team.name)}
              size="md"
            />
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-xl leading-tight text-foreground">
              {teamLabel(team.name)}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Ranking FIFA #{team.fifa_ranking} · {team.confederation}
            </p>
          </div>
        </div>
      </div>

      {team.players.length === 0 ? (
        <p className="border-t border-border px-4 py-5 text-sm leading-6 text-muted-foreground">
          No hay jugadores cargados para esta selección.
        </p>
      ) : (
        groupedPlayers(team.players).map(([position, players]) => (
          <div key={position} className="border-t border-border">
            <div className="flex items-center justify-between bg-[color:var(--surface-soft)] px-4 py-2">
              <h4 className="font-mono text-[11px] font-semibold uppercase text-muted-foreground">
                {POSITION_LABELS[position] ?? position}
              </h4>
              <span className="font-mono text-[10px] text-muted-foreground">
                {players.length}
              </span>
            </div>
            {players.map((player) => (
              <PlayerRow
                key={`${team.name}-${player.name}-${player.squad_number ?? "sn"}`}
                player={player}
              />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

function SquadTabs({
  teamA,
  teamB,
}: {
  teamA: MatchTeamDetail;
  teamB: MatchTeamDetail;
}) {
  const [activeTeam, setActiveTeam] = useState<"team_a" | "team_b">("team_a");
  const active = activeTeam === "team_a" ? teamA : teamB;
  const teams = [
    ["team_a", teamA],
    ["team_b", teamB],
  ] as const;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2">
        {teams.map(([key, team]) => {
          const isActive = activeTeam === key;
          const countryCode = TEAM_COUNTRY_CODES[team.name];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTeam(key)}
              className={
                isActive
                  ? "flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--primary-soft)] px-3 py-3 text-primary ring-1 ring-primary/35"
                  : "flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-muted-foreground transition-colors hover:bg-[color:var(--surface-soft)] hover:text-foreground"
              }
            >
              {countryCode ? (
                <Flag
                  countryCode={countryCode}
                  countryLabel={teamLabel(team.name)}
                  size="sm"
                />
              ) : null}
              <span className="truncate text-sm font-semibold">
                {teamLabel(team.name)}
              </span>
            </button>
          );
        })}
      </div>
      <SquadSection team={active} />
    </section>
  );
}

function RecommendationPanel({
  recommendation,
}: {
  recommendation: MatchRecommendation;
}) {
  const meta = CATEGORY_META[recommendation.category];
  const pct = Math.round(recommendation.score * 100);

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ backgroundColor: meta.soft, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="font-mono text-[11px] text-foreground/78">
          {pct}% afinidad
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground/88">
        {recommendation.explanation}
      </p>
    </section>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const { data: match, isPending, isError, error, refetch } = useMatchDetail(matchId);
  const recommendation = useMemo(
    () => getStoredRecommendation(matchId),
    [matchId],
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="px-5 pb-12">
        <div className="mx-auto max-w-3xl space-y-5 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: "/results" })}
            className="gap-1.5 rounded-full border-border bg-[color:var(--surface-soft)] px-4 text-muted-foreground hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Resultados
          </Button>

          {isPending ? <MatchSkeleton /> : null}

          {isError ? (
            <Alert variant="destructive">
              <AlertTitle>No pudimos cargar el partido</AlertTitle>
              <AlertDescription className="mt-1">
                {error instanceof Error ? error.message : "Error desconocido"}
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="ml-2 underline"
                >
                  Reintentar
                </button>
              </AlertDescription>
            </Alert>
          ) : null}

          {match ? (
            <>
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="px-4 py-5 sm:px-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:var(--primary-soft)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                      Grupo {match.group}
                    </span>
                    <span className="rounded-full border border-border bg-[color:var(--surface-soft)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Fecha {match.round_in_group}
                    </span>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-5 sm:gap-4 sm:py-6">
                    <div className="flex min-w-0 flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right">
                      {TEAM_COUNTRY_CODES[match.team_a.name] ? (
                        <Flag
                          countryCode={TEAM_COUNTRY_CODES[match.team_a.name]}
                          countryLabel={teamLabel(match.team_a.name)}
                          size="lg"
                          className="sm:order-2"
                        />
                      ) : null}
                      <h1 className="min-w-0 max-w-full text-wrap break-words text-3xl leading-none text-foreground max-[379px]:text-2xl sm:text-5xl">
                        {teamLabel(match.team_a.name)}
                      </h1>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-soft)] font-heading text-2xl text-muted-foreground max-[379px]:h-12 max-[379px]:w-12">
                      VS
                    </div>

                    <div className="flex min-w-0 flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-start sm:text-left">
                      {TEAM_COUNTRY_CODES[match.team_b.name] ? (
                        <Flag
                          countryCode={TEAM_COUNTRY_CODES[match.team_b.name]}
                          countryLabel={teamLabel(match.team_b.name)}
                          size="lg"
                        />
                      ) : null}
                      <h2 className="min-w-0 max-w-full text-wrap break-words text-3xl leading-none text-foreground max-[379px]:text-2xl sm:text-5xl">
                        {teamLabel(match.team_b.name)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-border bg-[color:var(--surface-soft)] px-4 py-4 sm:grid-cols-2 sm:px-6">
                  <div className="flex items-center gap-2 text-sm text-foreground/86">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatMatchDate(match.utc_datetime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/86">
                    <MapPin className="h-4 w-4 text-primary" />
                    {match.venue}, {match.city}
                  </div>
                </div>
              </section>

              {recommendation ? (
                <RecommendationPanel recommendation={recommendation} />
              ) : null}

              <SquadTabs teamA={match.team_a} teamB={match.team_b} />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
