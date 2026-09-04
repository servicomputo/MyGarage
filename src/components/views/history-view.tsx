"use client";

import { useVehicleHistory, useDashboard, useVehicle } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { EmptyState, ServiceIcon } from "@/components/ui-bits";
import { formatMileage, formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import { getMaintenanceType, getPartCategory, getExpenseCategory, colorClasses } from "@/lib/constants";
import { Loader2, History } from "lucide-react";

export function HistoryView() {
  const { params } = useNav();
  const vehicleId = params.id;

  // Hooks siempre llamados en el mismo orden
  const { data: dash, isLoading } = useDashboard();

  if (vehicleId) {
    return <VehicleHistory vehicleId={vehicleId} />;
  }

  // Historial global (de dashboard recentActivity)
  if (isLoading || !dash) {
    return (
      <div className="min-h-screen">
        <TopBar title="Historial" />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Agrupar por día
  const groups = groupByDay(dash.recentActivity);

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Historial" />
      <div className="px-4 py-3 space-y-4">
        {dash.recentActivity.length === 0 ? (
          <EmptyState emoji="📜" title="Sin actividad" description="Aún no hay registros en tu historial." />
        ) : (
          Object.entries(groups).slice(0, 20).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{day}</p>
              <Card className="overflow-hidden divide-y">
                {items.map((item, i) => (
                  <HistoryRow key={i} item={item} showVehicle />
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VehicleHistory({ vehicleId }: { vehicleId: string }) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: history, isLoading } = useVehicleHistory(vehicleId);

  if (isLoading || !vehicle) {
    return (
      <div className="min-h-screen">
        <TopBar title="Historial" showBack />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const groups = groupByDay(history || []);

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Historial" subtitle={`${vehicle.make} ${vehicle.model}`} showBack />
      <div className="px-4 py-3 space-y-4">
        {!history || history.length === 0 ? (
          <EmptyState emoji="📜" title="Sin actividad" description="Registra un mantenimiento para empezar tu historial." />
        ) : (
          Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{day}</p>
              <Card className="overflow-hidden divide-y">
                {items.map((item, i) => (
                  <HistoryRow key={i} item={item} />
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HistoryRow({ item, showVehicle }: { item: any; showVehicle?: boolean }) {
  const kind = item.kind;
  if (kind === "maintenance") {
    const m = item.data;
    const t = getMaintenanceType(m.type);
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <ServiceIcon type={m.type} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{m.customType || t.label}</p>
          <p className="text-xs text-muted-foreground">
            {showVehicle && item.vehicle ? `${item.vehicle.make} · ` : ""}
            {formatMileage(m.mileage ?? m.mileage)}
          </p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(m.amount ?? m.totalCost)}</span>
      </div>
    );
  }
  if (kind === "expense") {
    const e = item.data;
    const cat = getExpenseCategory(e.category);
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base shrink-0">{cat.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{e.title}</p>
          <p className="text-xs text-muted-foreground">{showVehicle && item.vehicle ? `${item.vehicle.make} · ` : ""}{formatRelativeTime(item.date)}</p>
        </div>
        <span className="text-sm font-semibold text-rose-600">{formatCurrency(e.amount)}</span>
      </div>
    );
  }
  if (kind === "fuel") {
    const f = item.data;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-base shrink-0">⛽</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Carga de combustible</p>
          <p className="text-xs text-muted-foreground">{showVehicle && item.vehicle ? `${item.vehicle.make} · ` : ""}{f.liters} L · {formatMileage(f.mileage)}</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(f.amount ?? f.total)}</span>
      </div>
    );
  }
  if (kind === "part") {
    const p = item.data;
    const cat = getPartCategory(p.category);
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base shrink-0">{cat.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{p.name}</p>
          <p className="text-xs text-muted-foreground">{showVehicle && item.vehicle ? `${item.vehicle.make} · ` : ""}{formatMileage(p.mileage ?? p.installMileage)}</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(p.amount ?? p.cost)}</span>
      </div>
    );
  }
  if (kind === "document") {
    const d = item.data;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base shrink-0">📎</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{d.title}</p>
          <p className="text-xs text-muted-foreground">{showVehicle && item.vehicle ? `${item.vehicle.make} · ` : ""}{formatRelativeTime(item.date)}</p>
        </div>
      </div>
    );
  }
  return null;
}

function groupByDay(items: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const day = formatDate(item.date);
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  }
  return groups;
}
