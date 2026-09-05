"use client";

import { ChevronLeft } from "lucide-react";
import { useNav } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}

export function TopBar({ title, subtitle, showBack = false, right, transparent = false }: TopBarProps) {
  const goBack = useNav((s) => s.goBack);
  return (
    <header
      className={cn(
        "sticky top-0 z-30 safe-top",
        transparent
          ? "bg-transparent"
          : "glass border-b border-border/60"
      )}
    >
      <div className="mx-auto max-w-md px-4 h-14 flex items-center gap-2">
        {showBack && (
          <button
            onClick={goBack}
            className="-ml-2 grid place-items-center h-9 w-9 rounded-full hover:bg-muted active:bg-muted tap-feedback group"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}
        <div className="flex-1 min-w-0 animate-fade-in">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
