import { MapPin } from "lucide-react";
import type { MatchRecommendation } from "@/types";
import { Flag } from "@/components/Flag";
import { TEAM_COUNTRY_CODES, TEAM_META } from "@/data/teams";

interface MatchRowProps {
  match: MatchRecommendation;
}

const CATEGORY_COLOR: Record<string, string> = {
  imperdible: "var(--secondary)",
  vale_la_pena: "var(--chart-3)",
  para_el_resumen: "var(--primary)",
};

function formatLocalDate(dateStr: string | null): {
  date: string;
  time: string;
} {
  if (!dateStr) return { date: "—", time: "—" };
  try {
    const d = new Date(dateStr);
    const date = d
      .toLocaleDateString("es-AR", { month: "short", day: "numeric" })
      .toUpperCase();
    const time = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: "—", time: "—" };
  }
}

export function MatchRow({ match }: MatchRowProps) {
  const color = CATEGORY_COLOR[match.category] ?? "var(--foreground)";
  const { date, time } = formatLocalDate(
    match.local_datetime ?? match.utc_datetime,
  );
  const teamAMeta = TEAM_META[match.team_a];
  const teamBMeta = TEAM_META[match.team_b];
  const teamACountryCode = TEAM_COUNTRY_CODES[match.team_a];
  const teamBCountryCode = TEAM_COUNTRY_CODES[match.team_b];
  const pct = Math.round(match.score * 100);

  return (
    <div className="relative flex gap-4 px-4 py-4 sm:px-5">
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              color,
            }}
          >
            Grupo {match.group}
          </span>
          <span className="text-[11px] text-muted-foreground">{date}</span>
          <span className="font-mono text-[11px] font-medium text-foreground/70">
            {time}
          </span>
        </div>

        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {teamACountryCode ? (
              <Flag
                countryCode={teamACountryCode}
                countryLabel={teamAMeta?.es ?? match.team_a}
                size="sm"
              />
            ) : null}
            <span className="truncate">{teamAMeta?.es ?? match.team_a}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {teamBCountryCode ? (
              <Flag
                countryCode={teamBCountryCode}
                countryLabel={teamBMeta?.es ?? match.team_b}
                size="sm"
              />
            ) : null}
            <span className="truncate">{teamBMeta?.es ?? match.team_b}</span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {match.city} · {match.venue}
          </span>
        </div>

        <p className="text-[13px] leading-5 text-foreground/78">
          {match.explanation}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-start rounded-2xl border border-border bg-[color:var(--surface-soft)] px-3 py-2 text-right">
        <div className="text-right">
          <span className="text-2xl leading-none" style={{ color }}>
            {pct}
          </span>
          <span className="text-xs opacity-70" style={{ color }}>
            %
          </span>
        </div>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color }}
        >
          afinidad
        </span>
      </div>
    </div>
  );
}
