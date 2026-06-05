import { apiClient } from "@/api/recommendations";

export async function getClubs(): Promise<{ clubs: string[] }> {
  const response = await apiClient.get("/clubs/suggestions");
  return response.json();
}
