import type { ChangeEvent, DragEvent, RefObject } from "react";
import { CheckCircle2, Upload } from "lucide-react";

interface IcsUploadZoneProps {
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
}

export function IcsUploadZone({
  file,
  inputRef,
  onFileChange,
}: IcsUploadZoneProps) {
  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    onFileChange(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".ics")) {
      onFileChange(dropped);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-border bg-[color:var(--surface-elevated)] px-6 py-9 text-center transition-colors hover:border-primary/55 hover:bg-[color:var(--surface-elevated-hover)]"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {file ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · Listo para subir
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-secondary underline underline-offset-4"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Cambiar archivo
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground/80" />
            <div>
              <p className="font-medium text-foreground">
                Subí tu calendario .ics
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Arrastrá el archivo aquí o hacé clic para seleccionarlo.
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={handleFileInput}
      />

      <p className="text-[11px] leading-relaxed text-muted-foreground/90">
        Exportá tu Google Calendar, Outlook o Apple Calendar como{" "}
        <span className="font-medium">.ics</span>. El backend analiza los
        eventos marcados como ocupados para calcular tu disponibilidad.
      </p>
    </div>
  );
}
