import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  getMaintenanceType,
  getPartCategory,
  getExpenseCategory,
} from "@/lib/constants";
import {
  getGreeting,
  getReminderStatus,
  startOfMonth,
  startOfYear,
} from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const vehicles = await db.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

   
  const vehiclesData: any[] = [];
   
  const allReminders: any[] = [];
   
  const recentItems: { date: Date; vehicleId: string; vehicleName: string; kind: string; data: any }[] = [];

  let totalSpendThisMonth = 0;
  let totalSpendThisYear = 0;
  let totalSpendAllTime = 0;

  for (const v of vehicles) {
    const vehicleName = `${v.make} ${v.model} ${v.year}`;
    const [expenses, lastMaintenance, reminders, parts, maintenances, fuelings] = await Promise.all([
      db.expense.findMany({ where: { vehicleId: v.id } }),
      db.maintenance.findFirst({ where: { vehicleId: v.id }, orderBy: { date: "desc" } }),
      db.reminder.findMany({ where: { vehicleId: v.id, enabled: true } }),
      db.part.findMany({ where: { vehicleId: v.id }, orderBy: { installDate: "desc" } }),
      db.maintenance.findMany({ where: { vehicleId: v.id }, orderBy: { date: "desc" } }),
      db.fueling.findMany({ where: { vehicleId: v.id }, orderBy: { date: "desc" } }),
    ]);

    const vehicleTotalSpend = expenses.reduce((s, e) => s + e.amount, 0);
    totalSpendThisMonth += expenses.filter((e) => e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
    totalSpendThisYear += expenses.filter((e) => e.date >= yearStart).reduce((s, e) => s + e.amount, 0);
    totalSpendAllTime += vehicleTotalSpend;

    // Next reminder for this vehicle
    const remindersWithStatus = reminders
      .filter((r) => r.nextDueKm || r.nextDueDate)
      .map((r) => ({ ...r, status: getReminderStatus(r, v.mileage), vehicleId: v.id, vehicleName }));
    const statusPriority = { overdue: 0, soon: 1, ok: 2, none: 3 } as const;
    remindersWithStatus.sort((a, b) => {
      const sa = statusPriority[a.status.status] ?? 4;
      const sb = statusPriority[b.status.status] ?? 4;
      if (sa !== sb) return sa - sb;
      const aDate = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
    const nextReminder = remindersWithStatus[0] ?? null;
    allReminders.push(...remindersWithStatus);

    vehiclesData.push({
      ...v,
      vehicleName,
      totalSpend: vehicleTotalSpend,
      lastMaintenance,
      nextReminder,
      partsCount: parts.length,
      maintenanceCount: maintenances.length,
    });

    // Recent activity
    for (const m of maintenances.slice(0, 5)) {
      const opt = getMaintenanceType(m.type);
      recentItems.push({
        date: m.date,
        vehicleId: v.id,
        vehicleName,
        kind: "maintenance",
        data: { id: m.id, type: m.type, title: m.customType ?? opt.label, amount: m.totalCost, mileage: m.mileage, icon: opt.emoji },
      });
    }
    for (const p of parts.slice(0, 5)) {
      const opt = getPartCategory(p.category);
      recentItems.push({
        date: p.installDate,
        vehicleId: v.id,
        vehicleName,
        kind: "part",
        data: { id: p.id, category: p.category, title: p.name, amount: p.cost, mileage: p.installMileage, icon: opt.emoji },
      });
    }
    for (const e of expenses.slice(0, 5)) {
      const opt = getExpenseCategory(e.category);
      recentItems.push({
        date: e.date,
        vehicleId: v.id,
        vehicleName,
        kind: "expense",
        data: { id: e.id, category: e.category, title: e.title, amount: e.amount, icon: opt.emoji },
      });
    }
    for (const f of fuelings.slice(0, 5)) {
      recentItems.push({
        date: f.date,
        vehicleId: v.id,
        vehicleName,
        kind: "fuel",
        data: { id: f.id, title: "Carga de combustible", amount: f.total, mileage: f.mileage, liters: f.liters, icon: "⛽" },
      });
    }
  }

  // Sort all reminders by most urgent (overdue first, then soon, then ok)
  const statusPriority = { overdue: 0, soon: 1, ok: 2, none: 3 } as const;
  allReminders.sort((a, b) => {
    const sa = statusPriority[a.status.status] ?? 4;
    const sb = statusPriority[b.status.status] ?? 4;
    if (sa !== sb) return sa - sb;
    const aDate = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
  const upcomingReminders = allReminders.slice(0, 10);

  recentItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivity = recentItems.slice(0, 8);

  return NextResponse.json({
    greeting: getGreeting(),
    vehicles: vehiclesData,
    upcomingReminders,
    totalSpendThisMonth,
    totalSpendThisYear,
    totalSpendAllTime,
    recentActivity,
  });
}
