import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeSlot } from "@/types";

const DAYS: { value: string; label: string }[] = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

interface SlotEditorProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

export function SlotEditor({ slots, onChange }: SlotEditorProps) {
  function getDayLabel(value: string | null) {
    return DAYS.find((day) => day.value === value)?.label ?? value ?? "Día";
  }

  function addSlot() {
    onChange([
      ...slots,
      { day_of_week: "saturday", start_hour: 14, end_hour: 22 },
    ]);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, patch: Partial<TimeSlot>) {
    onChange(slots.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function clampHour(v: number): number {
    return Math.max(0, Math.min(24, v));
  }

  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-2xl border border-border bg-[color:var(--surface-medium)] px-3 py-2.5"
        >
          <Select
            value={slot.day_of_week}
            onValueChange={(value) => {
              if (value) updateSlot(i, { day_of_week: value });
            }}
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 rounded-xl border-border bg-[color:var(--surface-elevated)] px-3 text-sm text-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20">
              <SelectValue placeholder="Día">
                {(value) => getDayLabel(value as string | null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border bg-popover text-popover-foreground ring-border">
              {DAYS.map((d) => (
                <SelectItem
                  key={d.value}
                  value={d.value}
                  label={d.label}
                  className="text-sm text-popover-foreground focus:bg-[color:var(--surface-elevated-hover)] focus:text-popover-foreground"
                >
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="number"
            min={0}
            max={23}
            value={slot.start_hour}
            onChange={(e) =>
              updateSlot(i, { start_hour: clampHour(Number(e.target.value)) })
            }
            className="w-16 rounded-xl border border-border bg-[color:var(--surface-elevated)] p-2 text-center font-mono text-sm text-foreground outline-none focus:border-primary/60"
          />

          <span className="text-muted-foreground/80">→</span>

          <input
            type="number"
            min={1}
            max={24}
            value={slot.end_hour}
            onChange={(e) =>
              updateSlot(i, { end_hour: clampHour(Number(e.target.value)) })
            }
            className="w-16 rounded-xl border border-border bg-[color:var(--surface-elevated)] p-2 text-center font-mono text-sm text-foreground outline-none focus:border-primary/60"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeSlot(i)}
            className="h-9 w-9 shrink-0 rounded-full border border-transparent text-muted-foreground hover:border-secondary/25 hover:bg-[color:var(--secondary-soft)] hover:text-secondary"
            aria-label="Eliminar horario"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addSlot}
        className="h-11 w-full rounded-2xl border-dashed border-border bg-[color:var(--surface-soft)] text-muted-foreground hover:border-primary/40 hover:bg-[color:var(--primary-soft-hover)] hover:text-foreground"
      >
        <Plus className="mr-1 h-4 w-4" />
        Agregar horario
      </Button>
    </div>
  );
}
