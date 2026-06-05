import { Fragment, useCallback, useEffect, useRef } from "react";
import type { TimeSlot } from "@/types";
import { isHourAvailable, paintHour } from "@/utils/timeSlots";

const DAYS: { value: string; label: string; labelLong: string }[] = [
  { value: "monday", label: "Lun", labelLong: "Lunes" },
  { value: "tuesday", label: "Mar", labelLong: "Martes" },
  { value: "wednesday", label: "Mié", labelLong: "Miércoles" },
  { value: "thursday", label: "Jue", labelLong: "Jueves" },
  { value: "friday", label: "Vie", labelLong: "Viernes" },
  { value: "saturday", label: "Sáb", labelLong: "Sábado" },
  { value: "sunday", label: "Dom", labelLong: "Domingo" },
];

interface WeekHeatmapProps {
  slots: TimeSlot[];
  onChange?: (slots: TimeSlot[]) => void;
}

export function WeekHeatmap({ slots, onChange }: WeekHeatmapProps) {
  const interactive = Boolean(onChange);
  const isPaintingRef = useRef(false);
  const paintModeRef = useRef<boolean | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef(slots);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  const applyPaint = useCallback(
    (day: string, hour: number, available: boolean) => {
      if (!onChange) return;
      const next = paintHour(slotsRef.current, day, hour, available);
      slotsRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const endPainting = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  const paintCellFromEvent = useCallback(
    (e: React.PointerEvent) => {
      if (!isPaintingRef.current || paintModeRef.current === null) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cell = target?.closest<HTMLElement>("[data-day][data-hour]");
      if (!cell) return;
      const day = cell.dataset.day;
      const hour = Number(cell.dataset.hour);
      if (!day || Number.isNaN(hour)) return;
      applyPaint(day, hour, paintModeRef.current);
    },
    [applyPaint],
  );

  const handleCellPointerDown = useCallback(
    (
      e: React.PointerEvent<HTMLButtonElement>,
      day: string,
      hour: number,
      currentlyAvailable: boolean,
    ) => {
      if (!onChange) return;
      e.preventDefault();
      paintModeRef.current = !currentlyAvailable;
      isPaintingRef.current = true;
      applyPaint(day, hour, paintModeRef.current);
    },
    [onChange, applyPaint],
  );

  const handlePointerUp = useCallback(() => {
    endPainting();
  }, [endPainting]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-[color:var(--surface-medium)] p-4">
      <div
        ref={gridRef}
        className={`grid ${interactive ? "select-none touch-none" : ""}`}
        style={{ gridTemplateColumns: "28px repeat(7, 1fr)", gap: "2px" }}
        onPointerMove={interactive ? paintCellFromEvent : undefined}
        onPointerUp={interactive ? handlePointerUp : undefined}
        onPointerCancel={interactive ? handlePointerUp : undefined}
        onPointerLeave={interactive ? handlePointerUp : undefined}
      >
        <div />
        {DAYS.map((d) => (
          <div
            key={d.value}
            className="pb-1 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            {d.label}
          </div>
        ))}

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
            {DAYS.map((d) => {
              const available = isHourAvailable(d.value, hour, slots);
              const hourLabel = `${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00`;
              const ariaLabel = `${d.labelLong} ${hourLabel}, ${available ? "disponible" : "no disponible"}`;

              if (!interactive) {
                return (
                  <div
                    key={`${d.value}-${hour}`}
                    style={{
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: available
                        ? "var(--primary)"
                        : "var(--surface-strong)",
                    }}
                  />
                );
              }

              return (
                <button
                  key={`${d.value}-${hour}`}
                  type="button"
                  data-day={d.value}
                  data-hour={hour}
                  aria-pressed={available}
                  aria-label={ariaLabel}
                  className="cursor-pointer border-0 p-0 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  style={{
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: available
                      ? "var(--primary)"
                      : "var(--surface-strong)",
                  }}
                  onPointerDown={(e) =>
                    handleCellPointerDown(e, d.value, hour, available)
                  }
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
