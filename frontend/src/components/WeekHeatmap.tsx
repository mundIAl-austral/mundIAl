import { Fragment } from "react";
import type { TimeSlot } from "@/types";

const DAYS: { value: string; label: string }[] = [
  { value: "monday", label: "Lun" },
  { value: "tuesday", label: "Mar" },
  { value: "wednesday", label: "Mié" },
  { value: "thursday", label: "Jue" },
  { value: "friday", label: "Vie" },
  { value: "saturday", label: "Sáb" },
  { value: "sunday", label: "Dom" },
];

interface WeekHeatmapProps {
  slots: TimeSlot[];
}

function isHourAvailable(
  day: string,
  hour: number,
  slots: TimeSlot[],
): boolean {
  return slots.some(
    (s) => s.day_of_week === day && hour >= s.start_hour && hour < s.end_hour,
  );
}

export function WeekHeatmap({ slots }: WeekHeatmapProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-[color:var(--surface-medium)] p-4">
      <div
        className="grid"
        style={{ gridTemplateColumns: "28px repeat(7, 1fr)", gap: "2px" }}
      >
        {/* Header row */}
        <div />
        {DAYS.map((d) => (
          <div
            key={d.value}
            className="pb-1 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            {d.label}
          </div>
        ))}

        {/* Hour rows */}
        {Array.from({ length: 24 }, (_, hour) => (
          <Fragment key={hour}>
            <div
              key={`label-${hour}`}
              className="flex items-center justify-end pr-1 font-mono text-[9px] text-muted-foreground/80"
              style={{
                height: 8,
                visibility: hour % 3 === 0 ? "visible" : "hidden",
              }}
            >
              {String(hour).padStart(2, "0")}
            </div>
            {DAYS.map((d) => (
              <div
                key={`${d.value}-${hour}`}
                style={{
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: isHourAvailable(d.value, hour, slots)
                    ? "var(--primary)"
                    : "var(--surface-strong)",
                }}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
