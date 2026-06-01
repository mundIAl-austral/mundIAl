import type { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  count: ReactNode;
  onEdit?: () => void;
  children: ReactNode;
}

export function SummaryCard({
  icon,
  iconBg = "var(--surface-elevated)",
  title,
  count,
  onEdit,
  children,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-sm text-foreground"
            style={{ backgroundColor: iconBg }}
          >
            {icon}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl leading-tight text-foreground">{count}</p>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer rounded-full border border-border bg-[color:var(--surface-soft)] px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-[color:var(--surface-medium)] hover:text-foreground"
          >
            Editar
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
