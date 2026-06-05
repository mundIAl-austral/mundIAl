import { Clock, MapPin } from "lucide-react";
import type { MatchRecommendation } from "@/types";
import { Flag } from "@/components/Flag";
import { TEAM_COUNTRY_CODES, TEAM_META } from "@/data/teams";

interface MatchRowProps {
  match: MatchRecommendation;
  onClick?: () => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  imperdible: "var(--secondary)",
  vale_la_pena: "var(--chart-3)",
  para_el_resumen: "var(--primary)",
};

function formatLocalDate(dateStr: string | null): {
  weekday: string;
  date: string;
  time: string;
} {
  if (!dateStr) return { weekday: "—", date: "—", time: "—" };
  try {
    const d = new Date(dateStr);
    const weekday = d
      .toLocaleDateString("es-AR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    const date = d
      .toLocaleDateString("es-AR", { month: "short", day: "numeric" })
      .replace(".", "")
      .toUpperCase();
    const time = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { weekday, date, time };
  } catch {
    return { weekday: "—", date: "—", time: "—" };
  }
}

function TeamBlock({
  name,
  countryCode,
  align,
}: {
  name: string;
  countryCode?: string;
  align: "left" | "right";
}) {
  const flag = countryCode ? (
    <Flag
      countryCode={countryCode}
      countryLabel={name}
      size="sm"
      className="sm:h-9 sm:w-12 sm:text-xl"
    />
  ) : null;
  const label = (
    <div className="min-w-0">
      <div
        className={
          align === "left"
            ? "whitespace-normal break-words text-right text-sm font-semibold leading-tight text-foreground sm:text-lg"
            : "whitespace-normal break-words text-left text-sm font-semibold leading-tight text-foreground sm:text-lg"
        }
      >
        {name}
      </div>
    </div>
  );

  return (
    <div
      className={
        align === "left"
          ? "flex min-w-0 items-center justify-end gap-3 text-left"
          : "flex min-w-0 items-center justify-start gap-3 text-right"
      }
    >
      {align === "left" ? (
        <>
          {label}
          {flag}
        </>
      ) : (
        <>
          {flag}
          {label}
        </>
      )}
    </div>
  );
}

export function MatchRow({ match, onClick }: MatchRowProps) {
  const color = CATEGORY_COLOR[match.category] ?? "var(--foreground)";
  const { weekday, date, time } = formatLocalDate(
    match.local_datetime ?? match.utc_datetime,
  );
  const teamAMeta = TEAM_META[match.team_a];
  const teamBMeta = TEAM_META[match.team_b];
  const teamACountryCode = TEAM_COUNTRY_CODES[match.team_a];
  const teamBCountryCode = TEAM_COUNTRY_CODES[match.team_b];
  const pct = Math.round(match.score * 100);
  const teamAName = teamAMeta?.es ?? match.team_a;
  const teamBName = teamBMeta?.es ?? match.team_b;
  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={
        isClickable
          ? "relative cursor-pointer px-4 py-4 transition-colors hover:bg-[color:var(--surface-soft)] focus-visible:bg-[color:var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-5"
          : "relative px-4 py-4 transition-colors hover:bg-[color:var(--surface-soft)] sm:px-5 sm:py-5"
      }
    >
      <div
        className="absolute left-0 top-4 h-[calc(100%-2rem)] w-1 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          Grupo {match.group}
        </span>
        <span className="font-mono text-[11px] font-semibold text-foreground/74">
          {pct}% afinidad
        </span>
      </div>

      <div className="mb-1 hidden w-full items-start justify-center gap-1.5 px-8 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-muted-foreground sm:flex">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
        <span className="whitespace-normal break-words">
          {match.venue}, {match.city}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
        <TeamBlock
          name={teamAName}
          countryCode={teamACountryCode}
          align="left"
        />

        <div className="flex w-[72px] shrink-0 flex-col items-center text-center sm:w-36">
          <div className="font-heading text-2xl leading-none text-foreground sm:text-4xl">
            {time}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:mt-1.5 sm:text-[11px] sm:tracking-[0.18em]">
            <Clock className="mr-1 inline h-3 w-3 align-[-2px]" />
            {weekday} {date}
          </div>
        </div>

        <TeamBlock
          name={teamBName}
          countryCode={teamBCountryCode}
          align="right"
        />
      </div>
    </div>
  );
}
