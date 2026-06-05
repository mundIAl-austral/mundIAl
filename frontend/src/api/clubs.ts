const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ClubsResponse {
  clubs: string[];
  total: number;
  limit: number;
  offset: number;
}

export async function getClubs(
  prefix = "",
  limit = 20,
  offset = 0,
  signal?: AbortSignal,
): Promise<ClubsResponse> {
  const params = new URLSearchParams({
    prefix,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${API_URL}/api/v1/clubs/suggestions?${params}`, {
    signal,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<ClubsResponse>;
}
