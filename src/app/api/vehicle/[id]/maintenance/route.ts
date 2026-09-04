import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const maintenanceSchema = z.object({
  type: z.string().min(1),
  customType: z.string().nullable().optional(),
  date: z.string().optional(),
  mileage: z.number().int().min(0),
  description: z.string().nullable().optional(),
  partsCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).optional(),
  workshop: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.string().nullable().optional(),
  receipt: z.string().nullable().optional(),
  // Si se debe crear automáticamente un gasto
  createExpense: z.boolean().default(true),
});

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const items = await db.maintenance.findMany({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
    take: limit,
  });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = maintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    // Si se provee totalCost explícito, úsalo; si no, suma parts + labor
    const totalCost = d.totalCost !== undefined
      ? d.totalCost
      : (d.partsCost ?? 0) + (d.laborCost ?? 0);
    const date = d.date ? new Date(d.date) : new Date();

    const created = await db.$transaction(async (tx) => {
      // Actualizar kilometraje del vehículo si el del mantenimiento es mayor
      let updatedVehicle = vehicle;
      if (d.mileage > vehicle.mileage) {
        updatedVehicle = await tx.vehicle.update({
          where: { id },
          data: { mileage: d.mileage },
        });
      }
      const maintenance = await tx.maintenance.create({
        data: {
          vehicleId: id,
          type: d.type,
          customType: d.customType ?? null,
          date,
          mileage: d.mileage,
          description: d.description ?? null,
          partsCost: d.partsCost ?? 0,
          laborCost: d.laborCost ?? 0,
          totalCost,
          workshop: d.workshop ?? null,
          notes: d.notes ?? null,
          photos: d.photos ?? null,
          receipt: d.receipt ?? null,
        },
      });
      // Crear gasto asociado si el total > 0
      if (d.createExpense && totalCost > 0) {
        await tx.expense.create({
          data: {
            vehicleId: id,
            category: "MAINTENANCE",
            title: maintenanceDescription(d.type, d.customType),
            amount: totalCost,
            date,
          },
        });
      }
      // Actualizar recordatorio relacionado si existe
      const reminderType = mapMaintenanceToReminder(d.type);
      if (reminderType) {
        const reminder = await tx.reminder.findFirst({
          where: { vehicleId: id, type: reminderType, enabled: true },
        });
        if (reminder) {
          const nextDueKm = reminder.intervalKm ? d.mileage + reminder.intervalKm : null;
          const nextDueDate = reminder.intervalDays
            ? new Date(date.getTime() + reminder.intervalDays * 24 * 60 * 60 * 1000)
            : null;
          await tx.reminder.update({
            where: { id: reminder.id },
            data: {
              lastDoneKm: d.mileage,
              lastDoneDate: date,
              nextDueKm,
              nextDueDate,
            },
          });
        }
      }
      return { maintenance, updatedVehicle };
    });

    return NextResponse.json(created.maintenance);
  } catch (e) {
    console.error("[maintenance POST]", e);
    return NextResponse.json({ error: "Error al registrar mantenimiento" }, { status: 500 });
  }
}

function maintenanceDescription(type: string, custom?: string | null): string {
  if (custom) return custom;
  const map: Record<string, string> = {
    OIL_CHANGE: "Cambio de aceite",
    GENERAL_SERVICE: "Servicio general",
    TIRES: "Llantas",
    BRAKES: "Frenos",
    BATTERY: "Batería",
    COOLANT: "Refrigerante",
    TRANSMISSION: "Transmisión",
    AC: "Aire acondicionado",
    ELECTRICAL: "Sistema eléctrico",
    REPAIR: "Reparación",
    FUEL: "Combustible",
    VERIFICATION: "Verificación",
    INSURANCE: "Seguro",
    TAX: "Tenencia",
    OTHER: "Otro",
  };
  return map[type] ?? "Mantenimiento";
}

function mapMaintenanceToReminder(type: string): string | null {
  const map: Record<string, string> = {
    OIL_CHANGE: "OIL_CHANGE",
    BRAKES: "BRAKES",
    TIRES: "TIRES",
    BATTERY: "BATTERY",
    TRANSMISSION: "TRANSMISSION",
    COOLANT: "COOLANT",
    VERIFICATION: "VERIFICATION",
    INSURANCE: "INSURANCE",
    TAX: "TAX",
  };
  return map[type] ?? null;
}
