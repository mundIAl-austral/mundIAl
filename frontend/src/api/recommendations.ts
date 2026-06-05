import type {
  FeedbackItem,
  PreviewResponse,
  RecommendationResponse,
  UserProfile,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Send only the fields the backend expects; available_slots and ics_source
// are frontend-only and must not be forwarded.
function profileBody(profile: UserProfile) {
  return {
    favorite_teams: profile.favorite_teams,
    favorite_players: profile.favorite_players,
    ics_content: profile.ics_content,
    timezone: profile.timezone,
    country: profile.country,
  };
}

export async function fetchRecommendations(
  profile: UserProfile,
  feedback?: FeedbackItem[],
): Promise<RecommendationResponse> {
  const body = {
    ...profileBody(profile),
    ...(feedback && feedback.length > 0 ? { feedback } : {}),
  };

  const response = await fetch(`${API_URL}/api/v1/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<RecommendationResponse>;
}

export async function getPreview(
  profile: UserProfile,
): Promise<PreviewResponse> {
  const response = await fetch(`${API_URL}/api/v1/recommend/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileBody(profile)),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<PreviewResponse>;
}
