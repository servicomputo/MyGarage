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
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 safe-bottom">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        {ITEMS.map((item) => {
          const active = view === item.view;
          const Icon = item.icon;
          if (item.primary) {
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="relative flex flex-col items-center justify-end pb-1 tap-feedback group"
                aria-label={item.label}
              >
                {/* Onda de pulso doble detrás del FAB */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-primary/20 animate-ripple" />
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-primary/15 animate-ripple" style={{ animationDelay: "0.8s" }} />

                {/* FAB principal con gradiente rico y brillo superior */}
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 grid place-items-center h-14 w-14 rounded-full text-primary-foreground shadow-xl glow-primary ring-4 ring-card transition-transform active:scale-90 group-hover:scale-105 overflow-hidden">
                  {/* Gradiente base */}
                  <span className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-primary to-emerald-600" />
                  {/* Brillo superior (efecto 3D) */}
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                  {/* Icono */}
                  <Icon className="relative h-6 w-6 drop-shadow-sm" strokeWidth={2.8} />
                </span>
                {/* Label centrado debajo */}
                <span className="relative text-[11px] font-medium text-muted-foreground mt-7">{item.label}</span>
              </button>
            );
          }
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 tap-feedback relative group",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              {/* Indicador de activo (barra superior con animación) */}
              {active && (
                <span className="absolute top-1 h-1 w-6 rounded-full bg-primary animate-scale-in" />
              )}
              <Icon
                className={cn("h-5 w-5 transition-transform", active ? "scale-110" : "group-hover:scale-105")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn("text-[11px] font-medium transition-colors", active && "text-primary")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
