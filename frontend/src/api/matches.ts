import type { MatchDetail } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchMatchDetail(matchId: string): Promise<MatchDetail> {
  const response = await fetch(
    `${API_URL}/api/v1/matches/${encodeURIComponent(matchId)}`,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<MatchDetail>;
}
