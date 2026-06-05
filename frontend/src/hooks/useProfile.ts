import { useState } from "react";
import { generateBusyIcs } from "@/utils/icsGenerator";
import type { TimeSlot, UserProfile } from "@/types";

const STORAGE_KEY = "mundial_profile";

function readProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Migration: old profiles have available_slots but no ics_content.
    // Regenerate the ICS from the stored slots so existing users don't have to redo setup.
    if (
      Array.isArray(parsed.available_slots) &&
      !parsed.ics_content &&
      typeof parsed.timezone === "string"
    ) {
      const slots = parsed.available_slots as TimeSlot[];
      const ics_content = generateBusyIcs(slots, parsed.timezone);
      const migrated: UserProfile = {
        favorite_teams: (parsed.favorite_teams as string[]) ?? [],
        favorite_players: (parsed.favorite_players as string[]) ?? [],
        favorite_clubs: (parsed.favorite_clubs as string[]) ?? [],
        available_slots: slots,
        ics_content,
        ics_source: "manual",
        timezone: parsed.timezone,
        country: (parsed.country as string) ?? "",
      };
      // Persist the migrated format so we don't re-migrate next time
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return parsed as unknown as UserProfile;
  } catch {
    return null;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readProfile(),
  );

  function saveProfile(p: UserProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  function clearProfile() {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }

  return { profile, saveProfile, clearProfile };
}
