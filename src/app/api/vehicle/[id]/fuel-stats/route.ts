import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { startOfMonth, startOfYear } from "@/lib/format";

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Cargas ordenadas de la más antigua a la más reciente
  const fuelings = await db.fueling.findMany({
    where: { vehicleId: id },
    orderBy: { date: "asc" },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const totalLiters = fuelings.reduce((s, f) => s + f.liters, 0);
  const totalFuelSpend = fuelings.reduce((s, f) => s + f.total, 0);
  const litersThisMonth = fuelings.filter((f) => f.date >= monthStart).reduce((s, f) => s + f.liters, 0);
  const spendThisMonth = fuelings.filter((f) => f.date >= monthStart).reduce((s, f) => s + f.total, 0);
  const litersThisYear = fuelings.filter((f) => f.date >= yearStart).reduce((s, f) => s + f.liters, 0);
  const spendThisYear = fuelings.filter((f) => f.date >= yearStart).reduce((s, f) => s + f.total, 0);

  // Consumo promedio (km/L) entre cargas (método tanque lleno a tanque lleno)
  let avgConsumption: number | null = null;
  let totalDistanceForConsumption = 0;
  let totalLitersForConsumption = 0;
  const consumptionPoints: { date: string; mileage: number; kmPerL: number | null }[] = [];
  if (fuelings.length >= 2) {
    for (let i = 1; i < fuelings.length; i++) {
      const prev = fuelings[i - 1];
      const curr = fuelings[i];
      // Solo calcular entre tanques llenos (más preciso)
      if (curr.fullTank && prev.fullTank) {
        const distance = curr.mileage - prev.mileage;
        if (distance > 0) {
          const kmPerL = distance / curr.liters;
          totalDistanceForConsumption += distance;
          totalLitersForConsumption += curr.liters;
          consumptionPoints.push({
            date: curr.date.toISOString(),
            mileage: curr.mileage,
            kmPerL: Math.round(kmPerL * 100) / 100,
          });
        }
      }
    }
    if (totalLitersForConsumption > 0 && totalDistanceForConsumption > 0) {
      avgConsumption = totalDistanceForConsumption / totalLitersForConsumption;
    }
  }

  // Costo por km (basado en todo el gasto de combustible / distancia recorrida desde primera carga)
  let costPerKm: number | null = null;
  if (fuelings.length >= 2) {
    const firstKm = fuelings[0].mileage;
    const lastKm = vehicle.mileage;
    const distance = lastKm - firstKm;
    if (distance > 0) {
      costPerKm = totalFuelSpend / distance;
    }
  }

  // Precio promedio por litro
  const avgPricePerL = totalLiters > 0 ? totalFuelSpend / totalLiters : 0;

  // Consumo por mes (para gráfico de tendencia)
  const monthlyMap: Record<string, { liters: number; spend: number; distance: number }> = {};
  for (let i = 1; i < fuelings.length; i++) {
    const curr = fuelings[i];
    const prev = fuelings[i - 1];
    const key = `${curr.date.getFullYear()}-${String(curr.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { liters: 0, spend: 0, distance: 0 };
    monthlyMap[key].liters += curr.liters;
    monthlyMap[key].spend += curr.total;
    if (curr.fullTank && prev.fullTank) {
      monthlyMap[key].distance += Math.max(0, curr.mileage - prev.mileage);
    }
  }
  const monthlyTrend = Object.entries(monthlyMap)
    .map(([key, v]) => ({
      month: key,
      liters: Math.round(v.liters * 100) / 100,
      spend: Math.round(v.spend * 100) / 100,
      kmPerL: v.liters > 0 && v.distance > 0 ? Math.round((v.distance / v.liters) * 100) / 100 : null,
      distance: v.distance,
    }))
    .slice(-6); // últimos 6 meses

  // Última carga
  const lastFueling = fuelings.length > 0 ? fuelings[fuelings.length - 1] : null;

  // Distancia recorrida total registrada
  const totalDistance = fuelings.length >= 2
    ? fuelings[fuelings.length - 1].mileage - fuelings[0].mileage
    : 0;

  return NextResponse.json({
    totalLiters: Math.round(totalLiters * 100) / 100,
    totalFuelSpend: Math.round(totalFuelSpend * 100) / 100,
    litersThisMonth: Math.round(litersThisMonth * 100) / 100,
    spendThisMonth: Math.round(spendThisMonth * 100) / 100,
    litersThisYear: Math.round(litersThisYear * 100) / 100,
    spendThisYear: Math.round(spendThisYear * 100) / 100,
    avgConsumption: avgConsumption !== null ? Math.round(avgConsumption * 100) / 100 : null,
    avgPricePerL: Math.round(avgPricePerL * 100) / 100,
    costPerKm: costPerKm !== null ? Math.round(costPerKm * 100) / 100 : null,
    totalDistance,
    fuelingCount: fuelings.length,
    lastFueling,
    monthlyTrend,
    consumptionPoints,
    fuelings: fuelings.reverse(), // devolver en orden desc para la lista
  });
}
