const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ClubsResponse {
  clubs: string[];
}

export async function getClubs(): Promise<ClubsResponse> {
  const res = await fetch(`${API_URL}/api/v1/clubs/suggestions`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<ClubsResponse>;
}
