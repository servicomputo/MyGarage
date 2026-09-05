"use client";

import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children, showNav = true, viewKey }: { children: React.ReactNode; showNav?: boolean; viewKey?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className={cn("flex-1 w-full mx-auto max-w-md", showNav && "pb-20")}>
        {/* key cambia con la vista -> React remonta el contenido y dispara la animación */}
        <div key={viewKey} className="animate-slide-in">
          {children}
        </div>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
