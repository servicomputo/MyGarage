"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-bits";
import { formatCurrency, formatDate } from "@/lib/format";
import { getExpenseCategory, colorClasses, EXPENSE_CATEGORIES } from "@/lib/constants";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { ChevronDown, Loader2, Plus, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ExpensesView() {
  const { data, isLoading } = useDashboard();
  const setView = useNav((s) => s.setView);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");

  if (isLoading || !data) {
    return (
      <div className="min-h-screen">
        <TopBar title="Gastos" />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Agregar gastos por vehículo y periodo
  const allExpenses: { vehicle: any; expense: any }[] = [];
  // Note: we don't have full expenses in dashboard, so we use the totals
  const thisMonth = data.totalSpendThisMonth;
  const thisYear = data.totalSpendThisYear;
  const total = data.totalSpendAllTime;

  // Per-vehicle spend (from vehicle.totalSpend)
  const vehicleSpend = data.vehicles.map((v) => ({
    name: `${v.make} ${v.model}`.slice(0, 14),
    amount: v.totalSpend,
    id: v.id,
  }));

  // Build category data from dashboard recentActivity? Not enough.
  // We'll fetch expenses from each vehicle when needed via select.
  // For now show the totals + per-vehicle bar chart.

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Gastos" />
      <div className="px-4 py-3 space-y-4">
        {/* Totales */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Este mes</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(thisMonth)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Este año</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(thisYear)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Histórico</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(total)}</p>
          </Card>
        </div>

        {/* Gasto por vehículo */}
        {vehicleSpend.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Gasto por vehículo</h3>
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleSpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid oklch(0.92 0 0)" }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="oklch(0.62 0.13 162)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Selector de vehículo para detalle */}
        {data.vehicles.length > 0 && (
          <Card className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Ver gastos de:</p>
            <div className="space-y-1">
              <button
                onClick={() => setView("dashboard")}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted tap-feedback"
              >
                <span className="text-sm">Resumen general</span>
              </button>
              {data.vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => openVehicle(v.id)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted tap-feedback"
                >
                  <div className="h-8 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {v.photo ? (
                       
                      <img src={v.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-sm">🚗</div>
                    )}
                  </div>
                  <span className="text-sm font-medium flex-1 text-left truncate">{v.make} {v.model}</span>
                  <span className="text-sm font-semibold">{formatCurrency(v.totalSpend)}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Actividad reciente de gastos */}
        <Card className="overflow-hidden">
          <h3 className="text-sm font-semibold px-4 pt-3 pb-2">Gastos recientes</h3>
          <div className="divide-y">
            {data.recentActivity
              .filter((a) => a.kind === "expense" || a.kind === "maintenance" || a.kind === "fuel")
              .slice(0, 8)
              .map((item, i) => {
                const e = item.data;
                const isMaint = item.kind === "maintenance";
                const isFuel = item.kind === "fuel";
                const cat = isMaint ? getExpenseCategory("MAINTENANCE") : isFuel ? getExpenseCategory("FUEL") : getExpenseCategory(e.category);
                const amount = isMaint ? e.totalCost : e.amount ?? e.total;
                const title = isMaint ? (e.customType || "Mantenimiento") : isFuel ? "Combustible" : e.title;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-lg shrink-0">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{title}</p>
                      <p className="text-xs text-muted-foreground">{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : ""} · {formatDate(item.date)}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                  </div>
                );
              })}
            {data.recentActivity.filter((a) => a.kind === "expense" || a.kind === "maintenance" || a.kind === "fuel").length === 0 && (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">No hay gastos registrados todavía.</p>
            )}
          </div>
        </Card>

        {data.vehicles.length === 0 && (
          <EmptyState emoji="📊" title="Sin datos de gastos" description="Agrega un vehículo y registra gastos para ver estadísticas." />
        )}
      </div>
    </div>
  );
}
