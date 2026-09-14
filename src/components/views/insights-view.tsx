"use client";

import { useDashboard, useVehicleStats, useVehicleMaintenance } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui-bits";
import { formatCurrency, formatMileage, round2 } from "@/lib/format";
import { getMaintenanceType } from "@/lib/constants";
import { Sparkles, TrendingUp, Wrench, Gauge, Loader2, Lightbulb } from "lucide-react";

export function InsightsView() {
  const { data: dash, isLoading } = useDashboard();

  if (isLoading || !dash) {
    return (
      <div className="min-h-screen">
        <TopBar title="Insights" showBack />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (dash.vehicles.length === 0) {
    return (
      <div className="min-h-screen">
        <TopBar title="Insights" showBack />
        <EmptyState emoji="✨" title="Sin datos suficientes" description="Agrega vehículos y registra servicios para ver insights inteligentes." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Insights" showBack />
      <div className="px-4 py-3 space-y-3">
        <InsightCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          tone="emerald"
          title="Gasto total"
          text={`Has gastado ${formatCurrency(dash.totalSpendAllTime)} en total entre todos tus vehículos, ${formatCurrency(dash.totalSpendThisYear)} este año.`}
        />

        {/* Insights por vehículo */}
        {dash.vehicles.map((v) => (
          <VehicleInsights key={v.id} vehicleId={v.id} vehicleName={`${v.make} ${v.model}`} />
        ))}
      </div>
    </div>
  );
}

function VehicleInsights({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const { data: stats } = useVehicleStats(vehicleId);
  const { data: maintenance } = useVehicleMaintenance(vehicleId);
  if (!stats) return null;

  // Insights calculados
  const insights: { icon: React.ReactNode; tone: string; title: string; text: string }[] = [];

  if (stats.maintenanceCount > 0) {
    const avgCost = stats.totalSpend / Math.max(stats.maintenanceCount, 1);
    insights.push({
      icon: <Wrench className="h-4 w-4" />,
      tone: "amber",
      title: `${vehicleName} · Patrones de servicio`,
      text: `Has realizado ${stats.maintenanceCount} servicios. El gasto promedio por servicio es de ${formatCurrency(avgCost)}.`,
    });
  }

  // Contar tipos de mantenimiento repetidos (sistema de frenos, etc.)
  if (maintenance && maintenance.length > 0) {
    const typeCounts: Record<string, number> = {};
    for (const m of maintenance) {
      typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
    }
    const repeated = Object.entries(typeCounts).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
    if (repeated.length > 0) {
      const [topType, count] = repeated[0];
      const t = getMaintenanceType(topType);
      insights.push({
        icon: <Lightbulb className="h-4 w-4" />,
        tone: "rose",
        title: `${vehicleName} · Repetición`,
        text: `Tu vehículo ha tenido ${count} servicios relacionados con ${t.label.toLowerCase()}. Considera revisar este sistema.`,
      });
    }
  }

  // Proyección próximo mantenimiento
  if (stats.lastMaintenance) {
    const lastM = stats.lastMaintenance;
    const t = getMaintenanceType(lastM.type);
    const interval = lastM.type === "OIL_CHANGE" ? 5000 : 10000;
    const projectedKm = lastM.mileage + interval;
    insights.push({
      icon: <Gauge className="h-4 w-4" />,
      tone: "sky",
      title: `${vehicleName} · Proyección`,
      text: `Según tu último ${t.label.toLowerCase()} a ${formatMileage(lastM.mileage)}, el próximo podría ser alrededor de ${formatMileage(projectedKm)}.`,
    });
  }

  // Combustible
  if (stats.fuelStats.avgConsumption && stats.fuelStats.avgConsumption > 0) {
    insights.push({
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "violet",
      title: `${vehicleName} · Combustible`,
      text: `Tu consumo promedio es de ${round2(stats.fuelStats.avgConsumption).toFixed(1)} km/L${stats.fuelStats.costPerKm ? `, con un costo de $${round2(stats.fuelStats.costPerKm).toFixed(2)} por km.` : "."}`,
    });
  }

  if (insights.length === 0) return null;

  return (
    <>
      {insights.map((ins, i) => (
        <InsightCard key={i} icon={ins.icon} tone={ins.tone} title={ins.title} text={ins.text} small />
      ))}
    </>
  );
}

function InsightCard({ icon, tone, title, text, small }: { icon: React.ReactNode; tone: string; title: string; text: string; small?: boolean }) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    rose: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
    sky: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900",
    violet: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900",
  };
  return (
    <Card className={`p-4 border ${toneClass[tone] ?? toneClass.emerald}`}>
      <div className="flex gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <p className={`font-semibold ${small ? "text-sm" : "text-base"}`}>{title}</p>
          <p className={`text-sm text-foreground/80 mt-1`}>{text}</p>
        </div>
      </div>
    </Card>
  );
}
