export interface TimeSlot {
  day_of_week: string;
  start_hour: number;
  end_hour: number;
}

export interface UserProfile {
  favorite_teams: string[];
  favorite_players: string[];
  /**
   * available_slots is kept for UI display purposes only (WeekHeatmap, hours stat).
   * For uploaded ICS, this is empty; the heatmap falls back to a "Calendario importado" notice.
   */
  available_slots: TimeSlot[];
  /**
   * Base64-encoded .ics file — this is what gets sent to the backend.
   * Either generated from available_slots (manual mode) or set from an uploaded file.
   */
  ics_content: string;
  /** Tracks how the ICS was produced; used only for display decisions in the UI. */
  ics_source: "manual" | "upload";
  timezone: string;
  country: string;
}

export interface ScoreBreakdown {
  team_affinity: number;
  rival_affinity: number;
  star_player_playing: number;
  availability_score: number;
  timezone_penalty: number;
  rivalry_index: number;
  star_power: number;
  group_stakes: number;
  expected_competitiveness: number;
  narrative_score: number;
  regional_affinity: number;
  playstyle_affinity: number;
}

export interface MatchRecommendation {
  match_id: string;
  group: string;
  team_a: string;
  team_b: string;
  utc_datetime: string;
  local_datetime: string | null;
  venue: string;
  city: string;
  score: number;
  category: "imperdible" | "vale_la_pena" | "para_el_resumen";
  explanation: string;
  score_breakdown: ScoreBreakdown;
}

export interface RecommendationResponse {
  imperdible: MatchRecommendation[];
  vale_la_pena: MatchRecommendation[];
  para_el_resumen: MatchRecommendation[];
}

export interface MatchPlayerDetail {
  name: string;
  squad_number: number | null;
  squad_position: string;
  detailed_position: string | null;
  alternative_positions: string[];
  club: string | null;
  is_captain: boolean;
  overall_rating: number;
  nationality: string | null;
  league: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
  play_styles: string[];
  photo_url: string | null;
  is_estimated: boolean;
  attributes: Record<string, number>;
}

export interface MatchTeamDetail {
  name: string;
  fifa_ranking: number;
  confederation: string;
  star_power: number;
  narrative_flags: Record<string, unknown>;
  players: MatchPlayerDetail[];
}

export interface MatchDetail {
  match_id: string;
  group: string;
  round_in_group: number;
  utc_datetime: string;
  venue: string;
  city: string;
  venue_country: string;
  narrative_score: number;
  rivalry_index: number;
  team_a: MatchTeamDetail;
  team_b: MatchTeamDetail;
}

export interface FeedbackItem {
  match_id: string;
  liked: boolean;
}

export interface PreviewResponse {
  matches: MatchRecommendation[];
}

export interface CatalogTeam {
  name: string;
  confederation: string;
}

export interface CatalogCountry {
  code: string;
  label: string;
}

export interface CatalogTimezone {
  value: string;
  label: string;
}
