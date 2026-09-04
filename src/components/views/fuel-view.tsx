"use client";

import { useVehicle, useVehicleFuelStats, useDeleteFuel, useVehicles } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, StatPill } from "@/components/ui-bits";
import { formatCurrency, formatDate, formatMileage, formatRelativeTime } from "@/lib/format";
import { FUEL_TYPES } from "@/lib/constants";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  Fuel, Loader2, Plus, ChevronRight, Trash2, Gauge, TrendingUp, Droplet, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export function FuelView() {
  const { params, setView, selectVehicle } = useNav();
  const vehicleId = params.id;
  const { data: vehicles } = useVehicles();

  // Si no hay vehicleId, mostrar selector
  if (!vehicleId) {
    return (
      <div className="min-h-screen">
        <TopBar title="Consumo de combustible" />
        <div className="px-4 py-3">
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState emoji="⛽" title="Sin vehículos" description="Agrega un vehículo para registrar cargas de combustible." />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">Selecciona un vehículo:</p>
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <Card
                    key={v.id}
                    className="p-3 flex items-center gap-3 cursor-pointer tap-feedback"
                    onClick={() => setView("fuel", { id: v.id })}
                  >
                    <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                      {v.photo ? (
                        <img src={v.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xl">🚗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{v.make} {v.model}</p>
                      <p className="text-xs text-muted-foreground">{formatMileage(v.mileage)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return <VehicleFuelView vehicleId={vehicleId} />;
}

function VehicleFuelView({ vehicleId }: { vehicleId: string }) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: fuel, isLoading } = useVehicleFuelStats(vehicleId);
  const del = useDeleteFuel(vehicleId);
  const setView = useNav((s) => s.setView);
  const selectVehicle = useNav((s) => s.selectVehicle);

  if (isLoading || !vehicle || !fuel) {
    return (
      <div className="min-h-screen">
        <TopBar title="Combustible" showBack />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (fuel.fuelingCount === 0) {
    return (
      <div className="min-h-screen">
        <TopBar title="Combustible" subtitle={`${vehicle.make} ${vehicle.model}`} showBack />
        <div className="px-4 py-3">
          <Button
            variant="outline"
            className="w-full h-11 mb-4"
            onClick={() => { selectVehicle(vehicleId); setView("add-fuel", { id: vehicleId }); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar carga
          </Button>
          <EmptyState
            emoji="⛽"
            title="Sin cargas registradas"
            description="Registra tu primera carga para ver el consumo (km/L), costo por km y gasto mensual."
          />
        </div>
      </div>
    );
  }

  // Datos para gráfico de consumo a lo largo del tiempo
  const chartData = fuel.consumptionPoints.map((p) => {
    const d = new Date(p.date);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return {
      name: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      kmPerL: p.kmPerL,
    };
  });

  // Datos para gráfico de gasto mensual
  const monthlyChart = fuel.monthlyTrend.map((m) => ({
    name: formatMonthLabel(m.month),
    gasto: m.spend,
    litros: m.liters,
  }));

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Combustible" subtitle={`${vehicle.make} ${vehicle.model}`} showBack />
      <div className="px-4 py-3 space-y-4">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={<Gauge className="h-4 w-4" />}
            label="Consumo promedio"
            value={fuel.avgConsumption !== null ? `${fuel.avgConsumption}` : "—"}
            unit="km/L"
            tone="emerald"
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Costo por km"
            value={fuel.costPerKm !== null ? `$${fuel.costPerKm}` : "—"}
            unit="MXN/km"
            tone="amber"
          />
          <MetricCard
            icon={<Droplet className="h-4 w-4" />}
            label="Litros totales"
            value={fuel.totalLiters.toFixed(1)}
            unit="L"
            tone="sky"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Gasto total"
            value={formatCurrency(fuel.totalFuelSpend)}
            tone="fuchsia"
          />
        </div>

        {/* Tarjeta destacada: consumo */}
        {fuel.avgConsumption !== null && (
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rendimiento actual</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {fuel.avgConsumption} <span className="text-base font-normal text-muted-foreground">km/L</span>
                </p>
                {fuel.avgConsumption >= 15 && <p className="text-xs text-emerald-600 mt-1">Excelente rendimiento</p>}
                {fuel.avgConsumption >= 10 && fuel.avgConsumption < 15 && <p className="text-xs text-emerald-600 mt-1">Buen rendimiento</p>}
                {fuel.avgConsumption >= 7 && fuel.avgConsumption < 10 && <p className="text-xs text-amber-600 mt-1">Rendimiento aceptable</p>}
                {fuel.avgConsumption < 7 && <p className="text-xs text-rose-600 mt-1">Consumo elevado</p>}
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/15 grid place-items-center">
                <Fuel className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>
        )}

        {/* Gráfico de tendencia de consumo */}
        {chartData.length >= 2 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">Tendencia de consumo (km/L)</h3>
            <div className="h-44 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} width={30} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v: number) => [`${v} km/L`, "Consumo"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid oklch(0.92 0 0)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kmPerL"
                    stroke="oklch(0.62 0.13 162)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.62 0.13 162)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Gráfico de gasto mensual */}
        {monthlyChart.length >= 1 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">Gasto mensual</h3>
            <div className="h-44 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Gasto"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid oklch(0.92 0 0)" }}
                  />
                  <Bar dataKey="gasto" radius={[6, 6, 0, 0]} fill="oklch(0.7 0.15 60)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Resumen de periodos */}
        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Este mes" value={formatCurrency(fuel.spendThisMonth)} accent="text-primary" />
          <StatPill label="Litros este mes" value={`${fuel.litersThisMonth.toFixed(1)} L`} />
          <StatPill label="Este año" value={formatCurrency(fuel.spendThisYear)} />
          <StatPill label="Litros este año" value={`${fuel.litersThisYear.toFixed(1)} L`} />
        </div>

        {/* Datos adicionales */}
        <Card className="p-4 space-y-2 text-sm">
          <Row label="Precio promedio por litro" value={`$${fuel.avgPricePerL}`} />
          <Row label="Distancia recorrida (registrada)" value={formatMileage(fuel.totalDistance)} />
          <Row label="Número de cargas" value={String(fuel.fuelingCount)} />
          {fuel.lastFueling && (
            <Row
              label="Última carga"
              value={`${formatRelativeTime(fuel.lastFueling.date)} · ${fuel.lastFueling.liters} L`}
            />
          )}
        </Card>

        {/* Botón agregar carga */}
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={() => { selectVehicle(vehicleId); setView("add-fuel", { id: vehicleId }); }}
        >
          <Plus className="mr-2 h-4 w-4" /> Registrar carga
        </Button>

        {/* Historial de cargas */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de cargas</h3>
          <div className="space-y-2">
            {fuel.fuelings.map((f) => {
              const ft = FUEL_TYPES.find((t) => t.value === f.fuelType) ?? FUEL_TYPES[0];
              return (
                <Card key={f.id} className="p-3 group">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-10 w-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-lg shrink-0">⛽</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{f.liters} L · {ft.label}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(f.date)} · {formatMileage(f.mileage)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{formatCurrency(f.total)}</p>
                          <p className="text-[11px] text-muted-foreground">${f.pricePerL.toFixed(2)}/L</p>
                        </div>
                      </div>
                      {f.station && <p className="text-[11px] text-muted-foreground mt-1">📍 {f.station}{f.fullTank ? " · Tanque lleno" : ""}</p>}
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm("¿Eliminar esta carga?")) return;
                        try { await del.mutateAsync(f.id); toast.success("Carga eliminada"); } catch { toast.error("Error"); }
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
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, unit, tone,
}: { icon: React.ReactNode; label: string; value: string; unit?: string; tone: string }) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
    sky: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300",
    fuchsia: "bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-700 dark:text-fuchsia-300",
  };
  return (
    <Card className="p-3">
      <div className={`inline-grid place-items-center h-7 w-7 rounded-lg ${toneClass[tone] ?? toneClass.emerald} mb-1.5`}>
        {icon}
      </div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">
        {value}
        {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return months[Number(m) - 1] ?? month;
}
