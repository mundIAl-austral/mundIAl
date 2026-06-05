import { useQuery } from "@tanstack/react-query";
import { fetchMatchDetail } from "@/api/matches";

export function useMatchDetail(matchId: string) {
  return useQuery({
    queryKey: ["match-detail", matchId],
    queryFn: () => fetchMatchDetail(matchId),
    enabled: matchId.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
