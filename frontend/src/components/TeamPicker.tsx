import {
  CONFEDERATION_LABELS,
  TEAMS_BY_CONFEDERATION,
  type TeamMeta,
  TEAM_COUNTRY_CODES,
  TEAM_META,
  type Confederation,
} from "@/data/teams";
import { Flag } from "@/components/Flag";
import type { CatalogTeam } from "@/types";

interface TeamPickerProps {
  selected: string[];
  onChange: (teams: string[]) => void;
  teams?: CatalogTeam[];
}

function buildTeamsByConfederation(
  teams: CatalogTeam[] | undefined,
): Record<string, string[]> {
  if (!teams || teams.length === 0) {
    return TEAMS_BY_CONFEDERATION as Record<string, string[]>;
  }

  const grouped: Record<string, string[]> = {};
  for (const team of teams) {
    if (!grouped[team.confederation]) grouped[team.confederation] = [];
    grouped[team.confederation].push(team.name);
  }

  Object.keys(grouped).forEach((conf) =>
    grouped[conf].sort((a, b) => a.localeCompare(b)),
  );
  return grouped;
}

export function TeamPicker({ selected, onChange, teams }: TeamPickerProps) {
  function toggle(team: string) {
    onChange(
      selected.includes(team)
        ? selected.filter((t) => t !== team)
        : [...selected, team],
    );
  }

  const selectedSet = new Set(selected);

  const teamsByConfederation = buildTeamsByConfederation(teams);
  const defaultOrder: Confederation[] = [
    "CONMEBOL",
    "UEFA",
    "CAF",
    "CONCACAF",
    "AFC",
    "OFC",
  ];
  const confederations = [
    ...defaultOrder.filter((conf) => teamsByConfederation[conf]?.length),
    ...Object.keys(teamsByConfederation).filter(
      (conf) => !defaultOrder.includes(conf as Confederation),
    ),
  ];

  return (
    <div className="space-y-6">
      {confederations.map((conf) => {
        const confTeams = teamsByConfederation[conf] ?? [];
        const selectedCount = confTeams.filter((t) =>
          selectedSet.has(t),
        ).length;
        return (
          <div key={conf}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {CONFEDERATION_LABELS[conf as Confederation] ?? conf}
              </span>
              <div className="h-px flex-1 bg-border" />
              {selectedCount > 0 && (
                <span className="rounded-full border border-border bg-[color:var(--surface-strong)] px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  {selectedCount}/{confTeams.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {confTeams.map((teamKey) => {
                const meta: TeamMeta | undefined = TEAM_META[teamKey];
                const countryCode = TEAM_COUNTRY_CODES[teamKey];
                const isSelected = selectedSet.has(teamKey);
                return (
                  <button
                    key={teamKey}
                    type="button"
                    onClick={() => toggle(teamKey)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 select-none ${
                      isSelected
                        ? "border-primary/30 bg-primary text-primary-foreground"
                        : "border-border bg-[color:var(--surface-soft)] text-foreground/90"
                    }`}
                  >
                    {countryCode ? (
                      <Flag
                        countryCode={countryCode}
                        countryLabel={meta?.es ?? teamKey}
                        size="sm"
                        className="border-current/10 bg-white/70"
                      />
                    ) : null}
                    <span>{meta?.es ?? teamKey}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
