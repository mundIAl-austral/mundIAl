interface StepperProgressProps {
  total: number;
  current: number;
  compact?: boolean;
}

export function StepperProgress({
  total,
  current,
  compact = false,
}: StepperProgressProps) {
  return (
    <div className={compact ? "" : "px-5 py-3"}>
      <div className={`flex gap-2 ${compact ? "" : "mx-auto max-w-3xl"}`}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isActive = step === current;

          return (
            <div
              key={step}
              className="h-2 flex-1 rounded-full transition-all duration-200"
              style={{
                backgroundColor: isCompleted
                  ? "var(--primary)"
                  : isActive
                    ? "var(--secondary)"
                    : "var(--progress-idle)",
                boxShadow: isActive ? "var(--glow-secondary)" : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
