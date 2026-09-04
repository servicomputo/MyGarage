"use client";

import { Home, Car, Plus, PieChart, Menu } from "lucide-react";
import { useNav } from "@/lib/store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { view: "dashboard", label: "Inicio", icon: Home },
  { view: "vehicles", label: "Vehículos", icon: Car },
  { view: "quick-register", label: "Registrar", icon: Plus, primary: true },
  { view: "expenses", label: "Gastos", icon: PieChart },
  { view: "more", label: "Más", icon: Menu },
] as const;

export function BottomNav() {
  const { view, setView } = useNav();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        {ITEMS.map((item) => {
          const active = view === item.view;
          const Icon = item.icon;
          if (item.primary) {
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="relative flex items-center justify-center tap-feedback"
                aria-label={item.label}
              >
                <span className="absolute -top-5 grid place-items-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-card">
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <span className="mt-6 text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            );
          }
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 tap-feedback",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
