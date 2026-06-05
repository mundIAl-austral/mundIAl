import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Clock3,
  Globe2,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { Flag } from "@/components/Flag";
import { NavBar } from "@/components/NavBar";
import { SummaryCard } from "@/components/SummaryCard";
import { WeekHeatmap } from "@/components/WeekHeatmap";
import { Button } from "@/components/ui/button";
import { COUNTRY_LABELS } from "@/data/countries";
import { TEAM_COUNTRY_CODES, TEAM_META } from "@/data/teams";
import { TIMEZONES } from "@/data/timezones";
import { useProfile } from "@/hooks/useProfile";
import { useSetupStep4 } from "@/hooks/useSetupStep4";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { countries, timezones } = useSetupStep4();

  function handleRecommend() {
    if (profile) void navigate({ to: "/feedback" });
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />

        <main className="px-5 pb-20">
          <div className="mx-auto max-w-3xl">
            <section className="rounded-2xl border border-border bg-card px-6 py-8 mt-6 sm:px-8 sm:py-10">
              <div className="max-w-3xl">
                <h1 className="max-w-2xl text-4xl leading-none text-foreground sm:text-5xl">
                  Elegí qué partidos del Mundial 2026 valen tu tiempo.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Armamos tu agenda ideal según tus equipos, jugadores y
                  horarios disponibles para separar imperdibles, planes
                  opcionales y resúmenes.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    void navigate({ to: "/setup", search: { step: 1 } })
                  }
                  className="h-12 gap-2 rounded-br-2xl rounded-bl-2xl rounded-tr-2xl rounded-tl-none px-6"
                  size="lg"
                >
                  Configurar mi perfil
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const totalHours =
    profile.ics_source === "manual"
      ? profile.available_slots.reduce(
          (sum, slot) => sum + (slot.end_hour - slot.start_hour),
          0,
        )
      : null;

  const tzLabel =
    timezones.find((tz) => tz.value === profile.timezone)?.label ??
    TIMEZONES.find((tz) => tz.value === profile.timezone)?.label ??
    profile.timezone;

  const countryLabel =
    countries.find((country) => country.code === profile.country)?.label ??
    COUNTRY_LABELS[profile.country] ??
    profile.country;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        rightSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: "/setup", search: { step: 1 } })}
            className="rounded-full border-border bg-[color:var(--surface-soft)] px-4 text-muted-foreground hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          >
            Editar perfil
          </Button>
        }
      />

      <main className="px-5 pb-36">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="px-1 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h1 className="text-2xl leading-tight text-foreground md:text-3xl">
                Ya está todo listo para priorizar tu Mundial.
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Revisá tu perfil y generá una clasificación pensada para lo que
              realmente te interesa mirar.
            </p>
          </div>

          <section className="grid gap-4">
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              iconBg="var(--secondary-soft)"
              title="Equipos favoritos"
              count={profile.favorite_teams.length}
              onEdit={() =>
                void navigate({ to: "/setup", search: { step: 1 } })
              }
            >
              <div className="flex flex-wrap gap-2">
                {profile.favorite_teams.map((team) => {
                  const meta = TEAM_META[team];
                  const countryCode = TEAM_COUNTRY_CODES[team];
                  return (
                    <span
                      key={team}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm text-foreground/88"
                    >
                      {countryCode ? (
                        <Flag
                          countryCode={countryCode}
                          countryLabel={meta?.es ?? team}
                          size="sm"
                        />
                      ) : null}
                      {meta?.es ?? team}
                    </span>
                  );
                })}
              </div>
            </SummaryCard>

            <SummaryCard
              icon={<Star className="h-4 w-4" />}
              iconBg="var(--primary-soft)"
              title="Jugadores favoritos"
              count={profile.favorite_players.length || "—"}
              onEdit={() =>
                void navigate({ to: "/setup", search: { step: 2 } })
              }
            >
              {profile.favorite_players.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_players.map((player) => (
                    <span
                      key={player}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm text-foreground/88"
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {player}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No agregaste jugadores todavía.
                </p>
              )}
            </SummaryCard>

            <SummaryCard
              icon={<Building2 className="h-4 w-4" />}
              iconBg="var(--secondary-soft)"
              title="Clubs favoritos"
              count={profile.favorite_clubs?.length || "—"}
              onEdit={() =>
                void navigate({ to: "/setup", search: { step: 3 } })
              }
            >
              {profile.favorite_clubs && profile.favorite_clubs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_clubs.map((club) => (
                    <span
                      key={club}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm text-foreground/88"
                    >
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      {club}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No agregaste clubs todavía.
                </p>
              )}
            </SummaryCard>

            <SummaryCard
              icon={<Clock3 className="h-4 w-4" />}
              iconBg="rgba(255, 209, 102, 0.12)"
              title="Disponibilidad"
              count={
                totalHours !== null ? `${totalHours} horas` : "Calendario .ics"
              }
              onEdit={() =>
                void navigate({ to: "/setup", search: { step: 3 } })
              }
            >
              {profile.ics_source === "manual" ? (
                <WeekHeatmap slots={profile.available_slots} />
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Estás usando un calendario importado para calcular tus
                  ventanas disponibles.
                </p>
              )}
            </SummaryCard>

            <SummaryCard
              icon={<Globe2 className="h-4 w-4" />}
              iconBg="rgba(142, 167, 255, 0.14)"
              title="Ubicación"
              count={
                <span className="inline-flex items-center gap-3">
                  <Flag
                    countryCode={profile.country}
                    countryLabel={countryLabel}
                    size="md"
                  />
                  <span>{countryLabel}</span>
                </span>
              }
              onEdit={() =>
                void navigate({ to: "/setup", search: { step: 4 } })
              }
            >
              <p className="text-sm leading-6 text-muted-foreground">
                {tzLabel}
              </p>
            </SummaryCard>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center px-5 py-3">
          <Button
            onClick={handleRecommend}
            className="h-12 w-full gap-2 rounded-2xl rounded-tl-xs"
            size="lg"
          >
            Ver mis recomendaciones
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
