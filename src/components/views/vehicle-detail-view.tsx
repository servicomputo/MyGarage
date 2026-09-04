"use client";

import { useState } from "react";
import {
  useVehicle,
  useVehicleStats,
  useVehicleMaintenance,
  useVehicleParts,
  useVehicleExpenses,
  useVehicleReminders,
  useVehicleDocuments,
  useVehicleHistory,
  useDeleteVehicle,
  useDeleteMaintenance,
  useDeletePart,
  useDeleteExpense,
  useDeleteReminder,
  useDeleteDocument,
} from "@/lib/queries";
import { useNav, openQuickRegister } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, StatusBadge, ServiceIcon, StatPill } from "@/components/ui-bits";
import {
  formatMileage,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getReminderStatus,
  getVehicleStatus,
} from "@/lib/format";
import { getMaintenanceType, getPartCategory, getExpenseCategory, getReminderType, getDocumentType, colorClasses, REMINDER_TYPES } from "@/lib/constants";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Calendar,
  Gauge,
  Wrench,
  Package,
  Receipt,
  FileText,
  Bell,
  TrendingUp,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type TabKey = "summary" | "maintenance" | "parts" | "expenses" | "documents";

export function VehicleDetailView() {
  const { params, setView, selectVehicle } = useNav();
  const id = params.id;
  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: stats } = useVehicleStats(id);
  const [tab, setTab] = useState<TabKey>("summary");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteVehicle = useDeleteVehicle();

  if (isLoading || !vehicle) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const vehicleStatus = stats ? getVehicleStatus(stats.nextReminders, vehicle.mileage) : { status: "ok" as const, label: "Todo en orden" };

  return (
    <div className="min-h-screen pb-4">
      <TopBar
        title={`${vehicle.make} ${vehicle.model}`}
        subtitle={`${vehicle.year}${vehicle.plates ? ` · ${vehicle.plates}` : ""}`}
        showBack
        right={
          <button
            onClick={() => {
              selectVehicle(id);
              setView("edit-vehicle", { id });
            }}
            className="grid place-items-center h-9 w-9 rounded-full hover:bg-muted tap-feedback"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />

      {/* Header con foto */}
      <div className="px-4 pt-2">
        <Card className="overflow-hidden">
          <div className="relative h-40 bg-muted">
            {vehicle.photo ? (
               
              <img src={vehicle.photo} alt={vehicle.make} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-5xl">🚗</div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-end justify-between gap-2">
                <div className="text-white">
                  <p className="text-xs opacity-90">{vehicle.color}{vehicle.version ? ` · ${vehicle.version}` : ""}</p>
                </div>
                <StatusBadge status={vehicleStatus.status} label={vehicleStatus.label} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x">
            <HeaderStat icon={Gauge} label="Km actual" value={formatMileage(vehicle.mileage).replace(" km", "")} unit="km" />
            <HeaderStat icon={Wrench} label="Servicios" value={String(stats?.maintenanceCount ?? 0)} />
            <HeaderStat icon={Package} label="Refacciones" value={String(stats?.partsCount ?? 0)} />
            <HeaderStat icon={TrendingUp} label="Gastado" value={formatCurrency(stats?.totalSpend ?? 0).replace("$", "$")} />
          </div>
        </Card>
      </div>

      {/* Botón principal de registro */}
      <div className="px-4 pt-3">
        <Button className="w-full h-12 text-base" onClick={() => openQuickRegister(id)}>
          <Plus className="mr-2 h-5 w-5" /> Registrar mantenimiento
        </Button>
      </div>

      {/* Pestañas */}
      <div className="px-4 pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="summary" className="text-xs py-2">Resumen</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-2">Mant.</TabsTrigger>
            <TabsTrigger value="parts" className="text-xs py-2">Refac.</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs py-2">Gastos</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs py-2">Docs.</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-3">
            <SummaryTab vehicleId={id} />
          </TabsContent>
          <TabsContent value="maintenance" className="mt-3">
            <MaintenanceTab vehicleId={id} />
          </TabsContent>
          <TabsContent value="parts" className="mt-3">
            <PartsTab vehicleId={id} />
          </TabsContent>
          <TabsContent value="expenses" className="mt-3">
            <ExpensesTab vehicleId={id} />
          </TabsContent>
          <TabsContent value="documents" className="mt-3">
            <DocumentsTab vehicleId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Acciones peligrosas */}
      <div className="px-4 pt-6">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar vehículo
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos sus mantenimientos, refacciones, gastos, recordatorios y documentos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await deleteVehicle.mutateAsync(id);
                  toast.success("Vehículo eliminado");
                  setView("vehicles");
                } catch (e) {
                  toast.error("No se pudo eliminar");
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HeaderStat({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string; unit?: string }) {
  return (
    <div className="p-2 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs font-bold truncate">
        {value}
        {unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

// === Pestaña Resumen ===
function SummaryTab({ vehicleId }: { vehicleId: string }) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: stats } = useVehicleStats(vehicleId);
  const { data: reminders } = useVehicleReminders(vehicleId);
  const setView = useNav((s) => s.setView);

  if (!vehicle || !stats) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;

  return (
    <div className="space-y-4">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Kilometraje" value={formatMileage(vehicle.mileage)} />
        <StatPill label="Gasto total" value={formatCurrency(stats.totalSpend)} accent="text-primary" />
        <StatPill label="Este mes" value={formatCurrency(stats.thisMonth)} />
        <StatPill label="Este año" value={formatCurrency(stats.thisYear)} />
      </div>

      {/* Último mantenimiento */}
      {stats.lastMaintenance && (
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground mb-1">Último mantenimiento</p>
          <div className="flex items-center gap-3">
            <ServiceIcon type={stats.lastMaintenance.type} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getMaintenanceType(stats.lastMaintenance.type).label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(stats.lastMaintenance.date)} · {formatMileage(stats.lastMaintenance.mileage)}
              </p>
            </div>
            <span className="text-sm font-semibold">{formatCurrency(stats.lastMaintenance.totalCost)}</span>
          </div>
        </Card>
      )}

      {/* Próximos recordatorios */}
      {reminders && reminders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 className="text-sm font-semibold">Recordatorios</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setView("reminders", { id: vehicleId })}>
              Ver todos
            </Button>
          </div>
          <div className="divide-y">
            {reminders.filter(r => r.enabled).slice(0, 3).map((r) => {
              const s = getReminderStatus(r, vehicle.mileage);
              const t = getReminderType(r.type);
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <StatusBadge status={s.status} label={s.status === "ok" ? "OK" : s.status === "soon" ? "Próximo" : s.status === "overdue" ? "Vencido" : ""} />
                </div>
              );
            })}
            {reminders.filter(r => r.enabled).length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">No hay recordatorios activos.</p>
            )}
          </div>
        </Card>
      )}

      {/* Actividad reciente */}
      {stats.recentActivity.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 className="text-sm font-semibold">Actividad reciente</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setView("history", { id: vehicleId })}>
              Ver historial
            </Button>
          </div>
          <div className="divide-y">
            {stats.recentActivity.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <ActivityIcon kind={item.kind} data={item.data} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activityTitle(item)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)}</p>
                </div>
                <span className="text-sm font-semibold">{activityAmount(item)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insight */}
      {stats.maintenanceCount > 0 && (
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="flex gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">Insight</p>
              <p className="text-sm">
                Has realizado <strong>{stats.maintenanceCount}</strong> servicios y gastado <strong>{formatCurrency(stats.totalSpend)}</strong> en total.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ActivityIcon({ kind, data }: { kind: string; data: any }) {
  if (kind === "maintenance") return <ServiceIcon type={data.type} size="sm" />;
  if (kind === "expense") return <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base">💸</span>;
  if (kind === "fuel") return <span className="grid place-items-center h-8 w-8 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-base">⛽</span>;
  if (kind === "part") return <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base">🧰</span>;
  if (kind === "document") return <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base">📎</span>;
  return <span className="grid place-items-center h-8 w-8 rounded-xl bg-muted text-base">•</span>;
}

function activityTitle(item: { kind: string; data: any }): string {
  if (item.kind === "maintenance") return item.data.customType || item.data.title || getMaintenanceType(item.data.type).label;
  if (item.kind === "expense") return item.data.title;
  if (item.kind === "fuel") return "Carga de combustible";
  if (item.kind === "part") return item.data.title || item.data.name;
  if (item.kind === "document") return item.data.title;
  return "Actividad";
}

function activityAmount(item: { kind: string; data: any }): string {
  if (item.kind === "maintenance") return formatCurrency(item.data.amount ?? item.data.totalCost);
  if (item.kind === "expense") return formatCurrency(item.data.amount);
  if (item.kind === "fuel") return formatCurrency(item.data.amount ?? item.data.total);
  if (item.kind === "part") return formatCurrency(item.data.amount ?? item.data.cost);
  return "";
}

// === Pestaña Mantenimiento ===
function MaintenanceTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleMaintenance(vehicleId);
  const del = useDeleteMaintenance(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        emoji="🔧"
        title="Sin mantenimientos"
        description="Registra el primer mantenimiento de este vehículo."
        action={<Button onClick={() => { selectVehicle(vehicleId); setView("quick-register", { id: vehicleId }); }} className="h-10"><Plus className="mr-2 h-4 w-4" /> Registrar</Button>}
      />
    );
  }
  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full h-10" onClick={() => { selectVehicle(vehicleId); setView("quick-register", { id: vehicleId }); }}>
        <Plus className="mr-2 h-4 w-4" /> Registrar mantenimiento
      </Button>
      <div className="space-y-2">
        {data.map((m) => {
          const t = getMaintenanceType(m.type);
          const c = colorClasses(t.color);
          return (
            <Card key={m.id} className="p-3 group">
              <div className="flex gap-3">
                <ServiceIcon type={m.type} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{m.customType || t.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.date)} · {formatMileage(m.mileage)}</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatCurrency(m.totalCost)}</span>
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{m.description}</p>}
                  {m.workshop && (
                    <p className="text-[11px] text-muted-foreground mt-1">🔧 {m.workshop}</p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar este registro?")) return;
                    try {
                      await del.mutateAsync(m.id);
                      toast.success("Registro eliminado");
                    } catch {
                      toast.error("No se pudo eliminar");
                    }
                  }}
                  className="opacity-60 hover:opacity-100 self-start p-1 -mr-1"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// === Pestaña Refacciones ===
function PartsTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleParts(vehicleId);
  const del = useDeletePart(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);
  const vehicle = useVehicle(vehicleId);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        emoji="🧰"
        title="Sin refacciones"
        description="Registra las refacciones instaladas."
        action={<Button onClick={() => { selectVehicle(vehicleId); setView("add-part", { id: vehicleId }); }} className="h-10"><Plus className="mr-2 h-4 w-4" /> Agregar refacción</Button>}
      />
    );
  }
  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full h-10" onClick={() => { selectVehicle(vehicleId); setView("add-part", { id: vehicleId }); }}>
        <Plus className="mr-2 h-4 w-4" /> Agregar refacción
      </Button>
      <div className="space-y-2">
        {data.map((p) => {
          const cat = getPartCategory(p.category);
          const c = colorClasses(cat.color);
          const needsChange = p.nextChangeKm && vehicle.data && p.nextChangeKm <= vehicle.data.mileage;
          return (
            <Card key={p.id} className="p-3">
              <div className="flex gap-3">
                <span className={cn_safe(c.bgSoft, c.text, "grid place-items-center h-10 w-10 rounded-xl text-lg shrink-0")}>{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.brand ? `${p.brand} · ` : ""}Instalado a {formatMileage(p.installMileage)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold">{formatCurrency(p.cost)}</span>
                      <button
                        onClick={async () => {
                          if (!confirm("¿Eliminar refacción?")) return;
                          try { await del.mutateAsync(p.id); toast.success("Eliminada"); } catch { toast.error("Error"); }
                        }}
                        className="block ml-auto mt-0.5"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {p.nextChangeKm && (
                    <p className={`text-[11px] mt-1 ${needsChange ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                      {needsChange && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                      Próximo cambio: {formatMileage(p.nextChangeKm)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// === Pestaña Gastos ===
function ExpensesTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleExpenses(vehicleId);
  const del = useDeleteExpense(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        emoji="💸"
        title="Sin gastos"
        description="Registra un gasto para este vehículo."
        action={<Button onClick={() => { selectVehicle(vehicleId); setView("add-expense", { id: vehicleId }); }} className="h-10"><Plus className="mr-2 h-4 w-4" /> Agregar gasto</Button>}
      />
    );
  }
  const total = data.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="space-y-2">
      <Card className="p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total registrado</span>
        <span className="text-base font-bold">{formatCurrency(total)}</span>
      </Card>
      <Button variant="outline" className="w-full h-10" onClick={() => { selectVehicle(vehicleId); setView("add-expense", { id: vehicleId }); }}>
        <Plus className="mr-2 h-4 w-4" /> Agregar gasto
      </Button>
      <div className="space-y-2">
        {data.map((e) => {
          const cat = getExpenseCategory(e.category);
          return (
            <Card key={e.id} className="p-3 flex items-center gap-3">
              <span className="text-lg shrink-0">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{cat.label} · {formatDate(e.date)}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(e.amount)}</span>
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar gasto?")) return;
                    try { await del.mutateAsync(e.id); toast.success("Eliminado"); } catch { toast.error("Error"); }
                  }}
                  className="block ml-auto mt-0.5"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// === Pestaña Documentos ===
function DocumentsTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useVehicleDocuments(vehicleId);
  const del = useDeleteDocument(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        emoji="📎"
        title="Sin documentos"
        description="Guarda facturas, pólizas y comprobantes."
        action={<Button onClick={() => { selectVehicle(vehicleId); setView("add-document", { id: vehicleId }); }} className="h-10"><Plus className="mr-2 h-4 w-4" /> Agregar documento</Button>}
      />
    );
  }
  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full h-10" onClick={() => { selectVehicle(vehicleId); setView("add-document", { id: vehicleId }); }}>
        <Plus className="mr-2 h-4 w-4" /> Agregar documento
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {data.map((d) => {
          const t = getDocumentType(d.type);
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                { }
                <img src={d.fileUrl} alt={d.title} className="h-full w-full object-cover" />
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar documento?")) return;
                    try { await del.mutateAsync(d.id); toast.success("Eliminado"); } catch { toast.error("Error"); }
                  }}
                  className="absolute top-1 right-1 h-7 w-7 grid place-items-center rounded-full bg-black/50 text-white"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{t.emoji}</span>
                  <p className="text-xs font-medium truncate flex-1">{d.title}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(d.date)}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Helper para evitar importar cn en este archivo
function cn_safe(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
