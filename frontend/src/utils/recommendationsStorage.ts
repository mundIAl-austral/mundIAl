import type { MatchRecommendation, RecommendationResponse } from "@/types";

const RECOMMENDATION_DATA_KEY = "recommendationData";
const RECOMMENDATION_BY_MATCH_KEY = "recommendationByMatchId";

type RecommendationByMatchId = Record<string, MatchRecommendation>;

function buildRecommendationIndex(
  data: RecommendationResponse,
): RecommendationByMatchId {
  return [
    ...data.imperdible,
    ...data.vale_la_pena,
    ...data.para_el_resumen,
  ].reduce<RecommendationByMatchId>((acc, match) => {
    acc[match.match_id] = match;
    return acc;
  }, {});
}

export function storeRecommendations(data: RecommendationResponse): void {
  const index = buildRecommendationIndex(data);
  sessionStorage.setItem(RECOMMENDATION_DATA_KEY, JSON.stringify(data));
  sessionStorage.setItem(RECOMMENDATION_BY_MATCH_KEY, JSON.stringify(index));
}

export function getStoredRecommendations(): RecommendationResponse | null {
  try {
    const rawData = sessionStorage.getItem(RECOMMENDATION_DATA_KEY);
    return rawData ? (JSON.parse(rawData) as RecommendationResponse) : null;
  } catch {
    return null;
  }
}

export function getStoredRecommendation(
  matchId: string,
): MatchRecommendation | null {
  try {
    const rawIndex = sessionStorage.getItem(RECOMMENDATION_BY_MATCH_KEY);
    if (rawIndex) {
      const parsed = JSON.parse(rawIndex) as RecommendationByMatchId;
      if (parsed[matchId]) return parsed[matchId];
    }

    const data = getStoredRecommendations();
    if (!data) return null;
    const index = buildRecommendationIndex(data);
    sessionStorage.setItem(RECOMMENDATION_BY_MATCH_KEY, JSON.stringify(index));
    return index[matchId] ?? null;
  } catch {
    return null;
  }
}
