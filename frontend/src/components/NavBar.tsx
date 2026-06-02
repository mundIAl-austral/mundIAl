import type { ReactNode } from "react";

interface NavBarProps {
  rightSlot?: ReactNode;
}

export function NavBar({ rightSlot }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-3 px-5 py-3">
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
