"use client";

import { useDashboard, useVehicleReminders, useVehicle, useUpdateReminder, useDeleteReminder } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState, StatusBadge } from "@/components/ui-bits";
import { formatMileage, formatDate, formatRelativeTime, getReminderStatus, STATUS_COLOR } from "@/lib/format";
import { getReminderType, colorClasses } from "@/lib/constants";
import { Bell, ChevronRight, Loader2, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function RemindersView() {
  const { data: dash, isLoading } = useDashboard();
  const { params } = useNav();
  const vehicleId = params.id;
  const setView = useNav((s) => s.setView);

  // Si hay vehicleId, mostrar recordatorios de ese vehículo
  if (vehicleId) {
    return <VehicleReminders vehicleId={vehicleId} />;
  }

  if (isLoading || !dash) {
    return (
      <div className="min-h-screen">
        <TopBar title="Recordatorios" />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Ordenar: overdue > soon > ok
  const sorted = [...dash.upcomingReminders].sort((a, b) => {
    const sa = getReminderStatus(a, a.vehicle?.mileage ?? 0).status;
    const sb = getReminderStatus(b, b.vehicle?.mileage ?? 0).status;
    const order = { overdue: 0, soon: 1, ok: 2, none: 3 };
    return (order[sa] ?? 3) - (order[sb] ?? 3);
  });

  const overdue = sorted.filter((r) => getReminderStatus(r, r.vehicle?.mileage ?? 0).status === "overdue");
  const soon = sorted.filter((r) => getReminderStatus(r, r.vehicle?.mileage ?? 0).status === "soon");

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Recordatorios" />
      <div className="px-4 py-3 space-y-4">
        {overdue.length > 0 && (
          <Card className="p-3 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{overdue.length} vencido(s)</p>
            </div>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80">Atiende estos recordatorios lo antes posible.</p>
          </Card>
        )}

        {sorted.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="Sin recordatorios"
            description="Crea recordatorios para no olvidar ningún mantenimiento."
          />
        ) : (
          <div className="space-y-2">
            {sorted.map((r) => {
              const s = getReminderStatus(r, r.vehicle?.mileage ?? 0);
              const t = getReminderType(r.type);
              const c = colorClasses(t.color);
              return (
                <Card key={r.id} className="p-3 cursor-pointer tap-feedback" onClick={() => r.vehicle && openVehicle(r.vehicle.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${c.bgSoft} ${c.text} text-lg`}>
                      {t.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={s.status} label={s.label} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleReminders({ vehicleId }: { vehicleId: string }) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: reminders, isLoading } = useVehicleReminders(vehicleId);
  const update = useUpdateReminder(vehicleId);
  const del = useDeleteReminder(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);

  if (isLoading || !vehicle) {
    return (
      <div className="min-h-screen">
        <TopBar title="Recordatorios" showBack />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Recordatorios" subtitle={`${vehicle.make} ${vehicle.model}`} showBack />
      <div className="px-4 py-3 space-y-3">
        <Button variant="outline" className="w-full h-10" onClick={() => { selectVehicle(vehicleId); setView("add-reminder", { id: vehicleId }); }}>
          <Plus className="mr-2 h-4 w-4" /> Crear recordatorio
        </Button>

        {!reminders || reminders.length === 0 ? (
          <EmptyState emoji="🔔" title="Sin recordatorios" description="Crea recordatorios para este vehículo." />
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const s = getReminderStatus(r, vehicle.mileage);
              const t = getReminderType(r.type);
              const c = colorClasses(t.color);
              const sc = STATUS_COLOR[s.status];
              return (
                <Card key={r.id} className={`overflow-hidden border-l-4`} >
                  <div className={`border-l-4 ${s.status === "overdue" ? "border-l-rose-500" : s.status === "soon" ? "border-l-amber-500" : "border-l-emerald-500"}`}>
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <span className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${c.bgSoft} ${c.text} text-lg`}>
                          {t.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{r.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                            </div>
                            <Switch
                              checked={r.enabled}
                              onCheckedChange={async (checked) => {
                                try {
                                  await update.mutateAsync({ id: r.id, data: { enabled: checked } });
                                } catch { toast.error("Error"); }
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            {r.intervalKm && <span>Cada {r.intervalKm.toLocaleString()} km</span>}
                            {r.intervalDays && <span>Cada {r.intervalDays} días</span>}
                            {r.lastDoneDate && <span>Último: {formatDate(r.lastDoneDate)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
