import { StepperProgress } from "@/components/StepperProgress";

interface StepperHeaderProps {
  step: number;
  total: number;
}

export function StepperHeader({ step, total }: StepperHeaderProps) {
  const padded = String(step).padStart(2, "0");
  const totalPadded = String(total).padStart(2, "0");

  const stepLabels: Record<number, string> = {
    1: "Equipos",
    2: "Jugadores",
    3: "Horarios",
    4: "Ubicación",
  };

  return (
    <header className="border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex min-h-16 w-full items-center justify-between gap-3 py-3">
          <div className="text-center">
            <span
              className="block text-2xl text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              mund<span className="text-primary">IA</span>l
            </span>
          </div>

          <span className="shrink-0  px-3 py-1 font-mono text-[11px] text-foreground/60">
            {padded} / {totalPadded} · {stepLabels[step] ?? ""}
          </span>
        </div>

        <div className="pb-4">
          <StepperProgress total={total} current={step} compact />
        </div>
      </div>
    </header>
  );
}
