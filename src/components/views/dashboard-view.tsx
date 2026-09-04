"use client";

import { useDashboard, useSeedDemo, type DashboardData } from "@/lib/queries";
import { useNav, openVehicle, openQuickRegister } from "@/lib/store";
import { formatCurrency, formatMileage, formatRelativeTime, getReminderStatus, STATUS_COLOR, type ReminderStatus } from "@/lib/format";
import { getMaintenanceType, getReminderType, colorClasses } from "@/lib/constants";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, StatusBadge, ServiceIcon } from "@/components/ui-bits";
import { Search, ChevronRight, Plus, Sparkles, Bell, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DashboardView() {
  const { data, isLoading, refetch } = useDashboard();
  const setView = useNav((s) => s.setView);
  const seed = useSeedDemo();

  const greeting = data?.greeting ?? "Hola";
  const name = "Usuario";

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state: no vehicles
  if (!data || data.vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar title="Inicio" right={
          <button onClick={() => setView("search")} className="grid place-items-center h-9 w-9 rounded-full hover:bg-muted tap-feedback">
            <Search className="h-5 w-5" />
          </button>
        } />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 grid place-items-center mb-4">
            <span className="text-4xl">🚗</span>
          </div>
          <h2 className="text-xl font-bold text-center">Bienvenido{name ? `, ${name}` : ""}</h2>
          <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
            Aún no tienes vehículos registrados. Agrega tu primer vehículo o carga datos de ejemplo para explorar la app.
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
            <Button onClick={() => setView("add-vehicle")} className="h-11">
              <Plus className="mr-2 h-4 w-4" /> Agregar vehículo
            </Button>
            <Button
              variant="outline"
              className="h-11"
              disabled={seed.isPending}
              onClick={async () => {
                try {
                  await seed.mutateAsync();
                  toast.success("Datos de ejemplo cargados");
                } catch (e) {
                  toast.error("No se pudieron cargar los datos");
                }
              }}
            >
              {seed.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Cargar datos de ejemplo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <TopBar
        title={`${greeting}${name ? `, ${name}` : ""}`}
        right={
          <button onClick={() => setView("search")} className="grid place-items-center h-9 w-9 rounded-full hover:bg-muted tap-feedback" aria-label="Buscar">
            <Search className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 space-y-4 mt-2">
        {/* Mis vehículos */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mis vehículos</h2>
            <button onClick={() => setView("vehicles")} className="text-xs text-primary font-medium">Ver todos</button>
          </div>
          <div className="space-y-3">
            {data.vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>

        {/* Próximos mantenimientos */}
        {data.upcomingReminders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Próximos mantenimientos</h2>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <Card className="overflow-hidden divide-y">
              {data.upcomingReminders.slice(0, 4).map((r) => {
                // La API devuelve r.status como objeto { status, label, subLabel }
                const statusObj = (r.status as any) ?? getReminderStatus(r, r.vehicle?.mileage ?? 0);
                const statusValue: ReminderStatus = typeof statusObj === "string" ? (statusObj as ReminderStatus) : statusObj.status;
                const statusInfo = typeof statusObj === "string" ? getReminderStatus(r, r.vehicle?.mileage ?? 0) : statusObj;
                const t = getReminderType(r.type);
                const c = colorClasses(t.color);
                return (
                  <button
                    key={r.id}
                    onClick={() => r.vehicle && openVehicle(r.vehicle.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left tap-feedback hover:bg-muted/30"
                  >
                    <span className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${c.bgSoft} ${c.text}`}>
                      {t.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={statusValue} label={statusInfo.label} />
                  </button>
                );
              })}
            </Card>
          </section>
        )}

        {/* Gastos */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Gastos</h2>
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Este mes</p>
              <p className="text-base font-bold mt-0.5">{formatCurrency(data.totalSpendThisMonth)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Este año</p>
              <p className="text-base font-bold mt-0.5">{formatCurrency(data.totalSpendThisYear)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Histórico</p>
              <p className="text-base font-bold mt-0.5">{formatCurrency(data.totalSpendAllTime)}</p>
            </Card>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-1 text-primary" onClick={() => setView("expenses")}>
            <TrendingUp className="mr-1.5 h-4 w-4" /> Ver gastos detallados
          </Button>
        </section>

        {/* Combustible */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Combustible</h2>
          </div>
          <Card className="overflow-hidden divide-y">
            {data.vehicles.map((v) => {
              const fs = (v as any).fuelStats;
              return (
                <button
                  key={v.id}
                  onClick={() => setView("fuel", { id: v.id })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 tap-feedback"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-base shrink-0">⛽</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.make} {v.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {fs && fs.fuelingCount > 0
                        ? `${fs.fuelingCount} cargas · ${fs.totalLiters} L · ${formatCurrency(fs.totalFuelSpend)}`
                        : "Sin cargas registradas"}
                    </p>
                  </div>
                  {fs && fs.avgConsumption !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{fs.avgConsumption}</p>
                      <p className="text-[10px] text-muted-foreground">km/L</p>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </Card>
        </section>

        {/* Última actividad */}
        {data.recentActivity.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Última actividad</h2>
            <Card className="overflow-hidden divide-y">
              {data.recentActivity.slice(0, 5).map((item, i) => (
                <ActivityRow key={i} item={item} />
              ))}
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: DashboardData["vehicles"][number] }) {
  const v = vehicle;
  const nextReminder = v.nextReminder;
  // El nextReminder del dashboard trae status como objeto { status, label, subLabel }
  const reminderStatusObj = nextReminder
    ? (nextReminder as any).status && typeof (nextReminder as any).status === "object"
      ? (nextReminder as any).status
      : getReminderStatus(nextReminder, v.mileage)
    : null;
  const status: ReminderStatus = reminderStatusObj?.status ?? "ok";
  const statusLabel = reminderStatusObj?.label ?? "Todo en orden";

  return (
    <Card
      className="overflow-hidden cursor-pointer tap-feedback animate-fade-up"
      onClick={(e) => {
        (e.currentTarget as HTMLElement).blur();
        openVehicle(v.id);
      }}
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-muted shrink-0">
          {v.photo ? (
             
            <img src={v.photo} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-2xl">🚗</div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{v.make} {v.model}</h3>
              <p className="text-xs text-muted-foreground truncate">{v.year}{v.color ? ` · ${v.color}` : ""}{v.plates ? ` · ${v.plates}` : ""}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>
          <p className="text-sm font-semibold mt-1">{formatMileage(v.mileage)}</p>
          <div className="mt-1.5">
            <StatusBadge status={status} label={statusLabel} />
          </div>
        </div>
      </div>
      {nextReminder && (
        <div className="bg-muted/40 px-3 py-2 flex items-center gap-2 border-t">
          <span className="text-xs text-muted-foreground">Próximo:</span>
          <span className="text-xs font-medium">{nextReminder.title}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {nextReminder.nextDueKm ? formatMileage(nextReminder.nextDueKm) : nextReminder.nextDueDate ? formatRelativeTime(nextReminder.nextDueDate) : ""}
          </span>
        </div>
      )}
      <div className="px-3 py-2 border-t flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            openQuickRegister(v.id);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
        </Button>
      </div>
    </Card>
  );
}

function ActivityRow({ item }: { item: DashboardData["recentActivity"][number] }) {
  const kind = item.kind;
  if (kind === "maintenance") {
    const m = item.data;
    const t = getMaintenanceType(m.type);
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <ServiceIcon type={m.type} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{m.customType || m.title || t.label}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)} · {formatMileage(m.mileage)}</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(m.amount ?? m.totalCost)}</span>
      </div>
    );
  }
  if (kind === "expense") {
    const e = item.data;
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base shrink-0">💸</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{e.title}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)}</p>
        </div>
        <span className="text-sm font-semibold text-rose-600">{formatCurrency(e.amount)}</span>
      </div>
    );
  }
  if (kind === "fuel") {
    const f = item.data;
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-base shrink-0">⛽</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Carga de combustible</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)} · {f.liters} L</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(f.amount ?? f.total)}</span>
      </div>
    );
  }
  if (kind === "part") {
    const p = item.data;
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base shrink-0">🧰</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{p.title || p.name}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)}</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(p.amount ?? p.cost)}</span>
      </div>
    );
  }
  return null;
}
