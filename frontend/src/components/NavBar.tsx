import type { ReactNode } from "react";

interface NavBarProps {
  rightSlot?: ReactNode;
}

export function NavBar({ rightSlot }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 px-5 pt-4 pb-2">
      <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-5">
        <span
          className="block text-2xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          mund<span className="text-primary">IA</span>l
        </span>
        {rightSlot && (
          <div className="flex items-center gap-2">{rightSlot}</div>
        )}
      </div>
    </header>
  );
}
