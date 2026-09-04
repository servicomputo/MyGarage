import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  getMaintenanceType,
  getPartCategory,
  getExpenseCategory,
  getDocumentType,
} from "@/lib/constants";
import { startOfMonth, startOfYear, getReminderStatus } from "@/lib/format";

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [expenses, maintenances, parts, fuelings, reminders] = await Promise.all([
    db.expense.findMany({ where: { vehicleId: id } }),
    db.maintenance.findMany({ where: { vehicleId: id }, orderBy: { date: "desc" } }),
    db.part.findMany({ where: { vehicleId: id } }),
    db.fueling.findMany({ where: { vehicleId: id }, orderBy: { date: "asc" } }),
    db.reminder.findMany({ where: { vehicleId: id, enabled: true } }),
  ]);

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const thisMonth = expenses
    .filter((e) => e.date >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);
  const thisYear = expenses
    .filter((e) => e.date >= yearStart)
    .reduce((sum, e) => sum + e.amount, 0);

   
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }

  const lastMaintenance = maintenances[0] ?? null;

  // Reminders: sort by soonest due (status priority then date)
  const remindersWithStatus = reminders
    .filter((r) => r.nextDueKm || r.nextDueDate)
    .map((r) => {
      const status = getReminderStatus(r, vehicle.mileage);
      return { ...r, status };
    });
  const statusPriority = { overdue: 0, soon: 1, ok: 2, none: 3 } as const;
  remindersWithStatus.sort((a, b) => {
    const sa = statusPriority[a.status.status] ?? 4;
    const sb = statusPriority[b.status.status] ?? 4;
    if (sa !== sb) return sa - sb;
    const aDate = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
  const nextReminders = remindersWithStatus.slice(0, 5);

  const partsCount = parts.length;

  // Fuel stats
  const totalLiters = fuelings.reduce((s, f) => s + f.liters, 0);
  const totalFuelSpend = fuelings.reduce((s, f) => s + f.total, 0);
  let avgConsumption: number | null = null;
  if (fuelings.length >= 2) {
    const firstKm = fuelings[0].mileage;
    const lastKm = fuelings[fuelings.length - 1].mileage;
    const distance = lastKm - firstKm;
    if (distance > 0) {
      const litersBetween = fuelings.slice(1).reduce((s, f) => s + f.liters, 0);
      if (litersBetween > 0) {
        avgConsumption = Math.round((distance / litersBetween) * 100) / 100;
      }
    }
  }
  const costPerKm = totalFuelSpend > 0 && vehicle.mileage > 0
    ? Math.round((totalFuelSpend / vehicle.mileage) * 100) / 100
    : null;

  // Recent activity (last 5 from history)
   
  const historyItems: { date: Date; kind: string; data: any }[] = [];
  for (const m of maintenances) {
    const opt = getMaintenanceType(m.type);
    historyItems.push({
      date: m.date,
      kind: "maintenance",
      data: { id: m.id, type: m.type, title: m.customType ?? opt.label, amount: m.totalCost, mileage: m.mileage, icon: opt.emoji },
    });
  }
  for (const p of parts) {
    const opt = getPartCategory(p.category);
    historyItems.push({
      date: p.installDate,
      kind: "part",
      data: { id: p.id, category: p.category, title: p.name, amount: p.cost, mileage: p.installMileage, icon: opt.emoji },
    });
  }
  for (const e of expenses) {
    const opt = getExpenseCategory(e.category);
    historyItems.push({
      date: e.date,
      kind: "expense",
      data: { id: e.id, category: e.category, title: e.title, amount: e.amount, icon: opt.emoji },
    });
  }
  for (const f of fuelings) {
    historyItems.push({
      date: f.date,
      kind: "fuel",
      data: { id: f.id, title: "Carga de combustible", amount: f.total, mileage: f.mileage, icon: "⛽" },
    });
  }
  for (const d of await db.document.findMany({ where: { vehicleId: id } })) {
    const opt = getDocumentType(d.type);
    historyItems.push({
      date: d.date,
      kind: "document",
      data: { id: d.id, type: d.type, title: d.title, icon: opt.emoji },
    });
  }
  historyItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivity = historyItems.slice(0, 5);

  return NextResponse.json({
    totalSpend,
    thisMonth,
    thisYear,
    byCategory,
    maintenanceCount: maintenances.length,
    lastMaintenance,
    nextReminders,
    partsCount,
    fuelStats: {
      totalLiters,
      totalFuelSpend,
      avgConsumption,
      costPerKm,
    },
    recentActivity,
  });
}
