import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { animate } from "animejs";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  MapPin,
  Shield,
  Star,
  Trophy,
} from "lucide-react";
import { z } from "zod";
import { searchPlayers } from "@/api/players";
import { StepperHeader } from "@/components/StepperHeader";
import { StepClubs } from "@/components/setup/StepClubs";
import { StepLocation } from "@/components/setup/StepLocation";
import { StepPlayers } from "@/components/setup/StepPlayers";
import { StepSchedule } from "@/components/setup/StepSchedule";
import { StepTeams } from "@/components/setup/StepTeams";
import { Button } from "@/components/ui/button";
import { useClubs } from "@/hooks/useClubs";
import { usePlayerSuggestions } from "@/hooks/usePlayerSuggestions";
import { useProfile } from "@/hooks/useProfile";
import { useSetupStep1 } from "@/hooks/useSetupStep1";
import { useSetupStep4 } from "@/hooks/useSetupStep4";
import { fileToBase64, generateBusyIcs } from "@/utils/icsGenerator";
import type { TimeSlot } from "@/types";

const TOTAL_STEPS = 5;

export const Route = createFileRoute("/setup")({
  validateSearch: z.object({
    step: z.number().min(1).max(TOTAL_STEPS).default(1),
  }),
  component: SetupPage,
});

function SetupPage() {
  const { step } = Route.useSearch();
  const navigate = useNavigate({ from: "/setup" });
  const { profile, saveProfile } = useProfile();
  const stepContentRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef(step);

  const { teams } = useSetupStep1();
  const { countries, timezones } = useSetupStep4();
  const { players: playerSuggestions } = usePlayerSuggestions();
  const { clubs } = useClubs();

  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    profile?.favorite_teams ?? [],
  );
  const [players, setPlayers] = useState<string[]>(
    profile?.favorite_players ?? [],
  );
  const [selectedClubs, setSelectedClubs] = useState<string[]>(
    profile?.favorite_clubs ?? [],
  );
  const [slots, setSlots] = useState<TimeSlot[]>(
    profile?.available_slots ?? [
      { day_of_week: "saturday", start_hour: 14, end_hour: 22 },
    ],
  );
  const [timezone, setTimezone] = useState(
    profile?.timezone ?? "America/Argentina/Buenos_Aires",
  );
  const [country, setCountry] = useState(profile?.country ?? "AR");

  // Step 3: track which input mode the user chose
  const [slotMode, setSlotMode] = useState<"manual" | "upload">(
    profile?.ics_source === "upload" ? "upload" : "manual",
  );
  // Uploaded .ics file (upload mode only)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setSelectedTeams(profile.favorite_teams);
      setPlayers(profile.favorite_players);
      setSelectedClubs(profile.favorite_clubs ?? []);
      setSlots(profile.available_slots);
      setTimezone(profile.timezone);
      setCountry(profile.country);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const panel = stepContentRef.current;

    if (!panel) {
      previousStepRef.current = step;
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      previousStepRef.current = step;
      return;
    }

    const direction = step >= previousStepRef.current ? 1 : -1;
    const animation = animate(panel, {
      opacity: [0, 1],
      translateX: [direction * 30, 0],
      duration: 250,
      ease: "outCubic",
    });

    previousStepRef.current = step;

    return () => {
      animation.revert();
    };
  }, [step]);

  const handlePlayerSearch = useCallback(
    async (q: string, signal: AbortSignal): Promise<string[]> => {
      const result = await searchPlayers(q, 8, signal);
      return result.players;
    },
    [],
  );

  function isStepValid() {
    if (step === 1) return selectedTeams.length > 0;
    if (step === 4) {
      if (slotMode === "manual") return slots.length > 0;
      return uploadedFile !== null;
    }
    if (step === 5) return timezone.length > 0 && country.trim().length >= 2;
    return true;
  }

  function goBack() {
    if (step === 1) {
      void navigate({ to: "/" });
    } else {
      void navigate({ to: "/setup", search: { step: step - 1 } });
    }
  }

  async function goNext() {
    if (step < TOTAL_STEPS) {
      void navigate({ to: "/setup", search: { step: step + 1 } });
      return;
    }

    // Last step — save the complete profile
    let ics_content: string;
    let ics_source: "manual" | "upload";

    if (slotMode === "upload" && uploadedFile) {
      // User uploaded their own calendar
      ics_content = await fileToBase64(uploadedFile);
      ics_source = "upload";
    } else {
      // Generate ICS from the manually selected available slots.
      // The ICS encodes the *complement* (busy hours) as weekly OPAQUE events.
      ics_content = generateBusyIcs(slots, timezone);
      ics_source = "manual";
    }

    saveProfile({
      favorite_teams: selectedTeams,
      favorite_players: players,
      favorite_clubs: selectedClubs,
      available_slots: slotMode === "manual" ? slots : [],
      ics_content,
      ics_source,
      timezone,
      country: country.toUpperCase().slice(0, 2),
    });
    void navigate({ to: "/" });
  }

  const stepTitles: Record<
    number,
    {
      title: string;
      subtitle: string;
      icon: ComponentType<{ className?: string }>;
    }
  > = {
    1: {
      icon: Shield,
      title: "Tus equipos",
      subtitle: "Elegí los equipos que más seguís. Podés seleccionar varios.",
    },
    2: {
      icon: Star,
      title: "Tus jugadores",
      subtitle: "Agregá los jugadores que no te querés perder.",
    },
    3: {
      icon: Trophy,
      title: "Tus clubs",
      subtitle: "Selecciona tus equipos de clubs favoritos (opcional).",
    },
    4: {
      icon: Clock3,
      title: "Tus horarios",
      subtitle: "Indicá cuándo podés mirar partidos durante la semana.",
    },
    5: {
      icon: MapPin,
      title: "Tu ubicación",
      subtitle: "Para mostrarte los horarios en tu zona horaria.",
    },
  };

  const {
    title,
    subtitle,
    icon: StepIcon,
  } = stepTitles[step] ?? {
    title: "",
    subtitle: "",
    icon: Shield,
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 z-50">
        <StepperHeader step={step} total={TOTAL_STEPS} />
      </div>

      <div className="overflow-x-hidden px-5 pb-36 pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 px-1 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
                <StepIcon className="h-5 w-5" />
              </div>
              <h1 className="text-2xl leading-tight text-foreground md:text-3xl">
                {title}
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div
            key={step}
            ref={stepContentRef}
            className="will-change-transform"
          >
            {step === 1 && (
              <StepTeams
                selectedTeams={selectedTeams}
                teams={teams}
                onChange={setSelectedTeams}
              />
            )}

            {step === 2 && (
              <StepPlayers
                players={players}
                suggestions={playerSuggestions}
                onChange={setPlayers}
                onSearch={handlePlayerSearch}
              />
            )}

            {step === 3 && (
              <StepClubs
                selectedClubs={selectedClubs}
                clubs={clubs}
                onChange={setSelectedClubs}
              />
            )}

            {step === 4 && (
              <StepSchedule
                slotMode={slotMode}
                slots={slots}
                uploadedFile={uploadedFile}
                fileInputRef={fileInputRef}
                onSlotModeChange={setSlotMode}
                onSlotsChange={setSlots}
                onUploadedFileChange={setUploadedFile}
              />
            )}

            {step === 5 && (
              <StepLocation
                country={country}
                timezone={timezone}
                countries={countries}
                timezones={timezones}
                onCountryChange={(nextCountry) =>
                  setCountry(nextCountry.toUpperCase().slice(0, 2))
                }
                onTimezoneChange={setTimezone}
              />
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-5 py-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={goBack}
              className="h-12 gap-2 rounded-2xl rounded-br-xs border-border bg-card px-5 text-foreground/80 hover:bg-[color:var(--surface-elevated-hover)] hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          )}
          <Button
            onClick={() => void goNext()}
            disabled={!isStepValid()}
            className="h-12 flex-1 gap-2 rounded-br-2xl rounded-bl-2xl rounded-tr-2xl rounded-tl-none"
          >
            {step === TOTAL_STEPS ? "Crear mi perfil" : "Continuar"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
