import type { CatalogCountry, CatalogTimezone } from "@/types";
import { Flag } from "@/components/Flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepLocationProps {
  country: string;
  timezone: string;
  countries: CatalogCountry[];
  timezones: CatalogTimezone[];
  onCountryChange: (country: string) => void;
  onTimezoneChange: (timezone: string) => void;
}

export function StepLocation({
  country,
  timezone,
  countries,
  timezones,
  onCountryChange,
  onTimezoneChange,
}: StepLocationProps) {
  function getTimezoneLabel(value: string | null) {
    return (
      timezones.find((currentTimezone) => currentTimezone.value === value)
        ?.label ??
      value ??
      "Seleccioná una zona horaria"
    );
  }

  function getCountryLabel(value: string | null) {
    const selectedCountry = countries.find(
      (currentCountry) => currentCountry.code === value,
    );

    if (!selectedCountry) {
      return value ?? "Seleccioná un país";
    }

    return (
      <span className="flex min-w-0 items-center gap-3">
        <Flag
          countryCode={selectedCountry.code}
          countryLabel={selectedCountry.label}
          size="sm"
        />
        <span className="truncate leading-none">
          {selectedCountry.label} ({selectedCountry.code})
        </span>
      </span>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Zona horaria
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            Para calcular los horarios locales
          </span>
        </label>
        <Select
          value={timezone}
          onValueChange={(value) => {
            if (value) onTimezoneChange(value);
          }}
        >
          <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-[color:var(--surface-elevated)] px-4 text-sm text-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 data-placeholder:text-muted-foreground">
            <SelectValue placeholder="Seleccioná una zona horaria">
              {(value) => getTimezoneLabel(value as string | null)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-border bg-popover text-popover-foreground ring-border">
            {timezones.map((tz) => (
              <SelectItem
                key={tz.value}
                value={tz.value}
                label={tz.label}
                className="text-sm text-popover-foreground focus:bg-[color:var(--surface-elevated-hover)] focus:text-popover-foreground"
              >
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          País
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            Código ISO de 2 letras (ej: AR, BR, MX)
          </span>
        </label>
        <Select
          value={country}
          onValueChange={(value) => {
            if (value) onCountryChange(value);
          }}
        >
          <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-[color:var(--surface-elevated)] px-4 text-sm text-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 data-placeholder:text-muted-foreground">
            <SelectValue placeholder="Seleccioná un país">
              {(value) => getCountryLabel(value as string | null)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-border bg-popover text-popover-foreground ring-border">
            {countries.map((currentCountry) => (
              <SelectItem
                key={currentCountry.code}
                value={currentCountry.code}
                label={`${currentCountry.label} (${currentCountry.code})`}
                className="text-sm text-popover-foreground focus:bg-[color:var(--surface-elevated-hover)] focus:text-popover-foreground"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Flag
                    countryCode={currentCountry.code}
                    countryLabel={currentCountry.label}
                    size="sm"
                  />
                  <span className="truncate leading-none">
                    {currentCountry.label} ({currentCountry.code})
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
