"use client";

import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { useNav } from "@/lib/store";
import {
  Bell, History, FileText, Sparkles, ChevronRight, Car, Info, Shield, Fuel,
} from "lucide-react";

export function MoreView() {
  const setView = useNav((s) => s.setView);

  const menu = [
    { icon: Fuel, label: "Combustible", desc: "Consumo, km/L y gasto por vehículo", onClick: () => setView("fuel") },
    { icon: Bell, label: "Recordatorios", desc: "Mantenimientos próximos y vencidos", onClick: () => setView("reminders") },
    { icon: History, label: "Historial", desc: "Línea de tiempo de actividad", onClick: () => setView("history") },
    { icon: FileText, label: "Documentos", desc: "Facturas, pólizas y comprobantes", onClick: () => setView("documents") },
    { icon: Sparkles, label: "Insights", desc: "Recomendaciones inteligentes", onClick: () => setView("insights") },
    { icon: Car, label: "Mis vehículos", desc: "Gestionar vehículos", onClick: () => setView("vehicles") },
  ];

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Más" />
      <div className="px-4 py-3 space-y-4">
        {/* Perfil */}
        <Card className="p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 grid place-items-center text-primary font-bold text-lg">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">Usuario Demo</p>
            <p className="text-xs text-muted-foreground truncate">Sesión local · datos guardados en este dispositivo</p>
          </div>
        </Card>

        {/* Menú */}
        <Card className="overflow-hidden divide-y">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 tap-feedback"
              >
                <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        {/* Acerca de */}
        <Card className="overflow-hidden divide-y">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Acerca de</p>
              <p className="text-xs text-muted-foreground">GarageBitácora v1.0 · PWA</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-muted">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Privacidad</p>
              <p className="text-xs text-muted-foreground">Tus datos solo son accesibles por ti</p>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Hecho con ❤️ para tu vehículo
        </p>
      </div>
    </div>
  );
}
