import { PlayerInput } from "@/components/PlayerInput";

interface StepPlayersProps {
  players: string[];
  suggestions: string[];
  onChange: (players: string[]) => void;
  onSearch: (query: string, signal: AbortSignal) => Promise<string[]>;
}

export function StepPlayers({
  players,
  suggestions,
  onChange,
  onSearch,
}: StepPlayersProps) {
  return (
    <PlayerInput
      selected={players}
      onChange={onChange}
      suggestions={suggestions}
      onSearch={onSearch}
    />
  );
}
