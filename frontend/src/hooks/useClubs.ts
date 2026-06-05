import { useQuery } from "@tanstack/react-query";
import { getClubs } from "@/api/clubs";

const FALLBACK_CLUBS: string[] = [];

export function useClubs() {
  const query = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const result = await getClubs();
      return result.clubs;
    },
    staleTime: 5 * 60 * 1000,
  });

  const clubs = query.data ?? FALLBACK_CLUBS;
  return { ...query, clubs };
}
