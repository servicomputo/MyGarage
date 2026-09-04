"use client";

import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className={cn("flex-1 w-full mx-auto max-w-md", showNav && "pb-20")}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
