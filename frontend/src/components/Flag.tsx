import { useState } from "react";
import { COUNTRY_LABELS } from "@/data/countries";
import { cn } from "@/lib/utils";

const FLAG_SIZE_STYLES = {
  sm: "h-6 w-8 text-sm",
  md: "h-7 w-10 text-base",
  lg: "h-9 w-12 text-xl",
} as const;

interface FlagProps {
  countryCode: string;
  countryLabel?: string;
  size?: keyof typeof FLAG_SIZE_STYLES;
  className?: string;
}

function getFlagUrl(countryCode: string) {
  return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
}

export function Flag({
  countryCode,
  countryLabel,
  size = "md",
  className,
}: FlagProps) {
  const normalizedCode = countryCode.trim().toUpperCase();
  const accessibleLabel =
    countryLabel ?? COUNTRY_LABELS[normalizedCode] ?? normalizedCode;
  const isValidCountryCode = /^[A-Z]{2}$/.test(normalizedCode);
  const [hasImageError, setHasImageError] = useState(!isValidCountryCode);

  return (
    <span
      role="img"
      aria-label={`Bandera de ${accessibleLabel}`}
      title={accessibleLabel}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/80 bg-[color:var(--surface-soft)] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] rounded-tl-[4px] rounded-tr-[10px] rounded-br-[4px] rounded-bl-[10px]",
        FLAG_SIZE_STYLES[size],
        className,
      )}
    >
      {hasImageError ? (
        <span className="px-1 font-mono text-[10px] leading-none font-medium tracking-[0.16em] text-foreground/72">
          {normalizedCode}
        </span>
      ) : (
        <img
          src={getFlagUrl(normalizedCode)}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      )}
    </span>
  );
}
