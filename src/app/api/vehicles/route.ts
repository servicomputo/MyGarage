import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const vehicleSchema = z.object({
  photo: z.string().nullable().optional(),
  make: z.string().min(1, "Marca requerida"),
  model: z.string().min(1, "Modelo requerido"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  version: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  plates: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  mileage: z.number().int().min(0).default(0),
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const vehicles = await db.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { maintenances: true, parts: true, expenses: true } },
    },
  });
  // Calcular gasto total y próximo mantenimiento
  const result = await Promise.all(
    vehicles.map(async (v) => {
      const totalSpend = await db.expense.aggregate({
        where: { vehicleId: v.id },
        _sum: { amount: true },
      });
      const reminders = await db.reminder.findMany({
        where: { vehicleId: v.id, enabled: true },
        orderBy: { nextDueDate: "asc" },
      });
      const nextReminder = reminders.find((r) => r.nextDueKm || r.nextDueDate) || null;
      const lastMaintenance = await db.maintenance.findFirst({
        where: { vehicleId: v.id },
        orderBy: { date: "desc" },
      });
      return {
        ...v,
        totalSpend: totalSpend._sum.amount ?? 0,
        nextReminder,
        lastMaintenance,
      };
    })
  );
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const vehicle = await db.vehicle.create({
      data: {
        userId: user.id,
        photo: d.photo ?? null,
        make: d.make,
        model: d.model,
        year: d.year,
        version: d.version ?? null,
        color: d.color ?? null,
        plates: d.plates ?? null,
        vin: d.vin ?? null,
        mileage: d.mileage,
        purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : null,
        purchasePrice: d.purchasePrice ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    console.error("[vehicles POST]", e);
    return NextResponse.json({ error: "Error al crear vehículo" }, { status: 500 });
  }
}
