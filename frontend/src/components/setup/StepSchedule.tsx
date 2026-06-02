import type { RefObject } from "react";
import { Calendar, Upload } from "lucide-react";
import { SlotEditor } from "@/components/SlotEditor";
import { WeekHeatmap } from "@/components/WeekHeatmap";
import { IcsUploadZone } from "@/components/setup/IcsUploadZone";
import type { TimeSlot } from "@/types";

interface StepScheduleProps {
  slotMode: "manual" | "upload";
  slots: TimeSlot[];
  uploadedFile: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSlotModeChange: (mode: "manual" | "upload") => void;
  onSlotsChange: (slots: TimeSlot[]) => void;
  onUploadedFileChange: (file: File | null) => void;
}

export function StepSchedule({
  slotMode,
  slots,
  uploadedFile,
  fileInputRef,
  onSlotModeChange,
  onSlotsChange,
  onUploadedFileChange,
}: StepScheduleProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-2 rounded-2xl border border-border bg-[color:var(--surface-elevated)] p-1.5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSlotModeChange("manual")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
            slotMode === "manual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Seleccionar manualmente
        </button>
        <button
          type="button"
          onClick={() => onSlotModeChange("upload")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
            slotMode === "upload"
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          Subir .ics
        </button>
      </div>

      {slotMode === "manual" ? (
        <>
          <WeekHeatmap slots={slots} />
          <SlotEditor slots={slots} onChange={onSlotsChange} />
        </>
      ) : (
        <IcsUploadZone
          file={uploadedFile}
          inputRef={fileInputRef}
          onFileChange={onUploadedFileChange}
        />
      )}
    </section>
  );
}
