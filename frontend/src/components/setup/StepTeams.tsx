import { TeamPicker } from "@/components/TeamPicker";
import type { CatalogTeam } from "@/types";

interface StepTeamsProps {
  selectedTeams: string[];
  teams: CatalogTeam[];
  onChange: (teams: string[]) => void;
}

export function StepTeams({ selectedTeams, teams, onChange }: StepTeamsProps) {
  return (
    <TeamPicker selected={selectedTeams} onChange={onChange} teams={teams} />
  );
}
