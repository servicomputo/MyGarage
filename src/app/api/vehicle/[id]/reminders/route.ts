import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { addDays } from "@/lib/format";

const reminderSchema = z.object({
  type: z.string().default("OTHER"),
  customType: z.string().nullable().optional(),
  title: z.string().min(1, "Título requerido"),
  intervalKm: z.number().int().min(0).nullable().optional(),
  intervalDays: z.number().int().min(0).nullable().optional(),
  lastDoneKm: z.number().int().min(0).nullable().optional(),
  lastDoneDate: z.string().nullable().optional(),
  nextDueKm: z.number().int().min(0).nullable().optional(),
  nextDueDate: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  // SQLite no soporta nullsLast directamente en orderBy de Prisma;
  // ordenamos por nextDueDate asc y dejamos que nulls queden al final en JS.
  const items = await db.reminder.findMany({
    where: { vehicleId: id },
  });
  items.sort((a, b) => {
    const aDate = a.nextDueDate ? new Date(a.nextDueDate).getTime() : null;
    const bDate = b.nextDueDate ? new Date(b.nextDueDate).getTime() : null;
    if (aDate == null && bDate == null) return 0;
    if (aDate == null) return 1;
    if (bDate == null) return -1;
    return aDate - bDate;
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
    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    // Calcular nextDueKm
    let nextDueKm = d.nextDueKm ?? null;
    if (nextDueKm == null) {
      if (d.lastDoneKm != null && d.intervalKm != null) {
        nextDueKm = d.lastDoneKm + d.intervalKm;
      } else if (d.intervalKm != null && d.lastDoneKm == null) {
        nextDueKm = vehicle.mileage + d.intervalKm;
      }
    }

    // Calcular nextDueDate
    let nextDueDate: Date | null = null;
    if (d.nextDueDate) {
      nextDueDate = new Date(d.nextDueDate);
    } else if (d.intervalDays != null) {
      if (d.lastDoneDate) {
        nextDueDate = addDays(new Date(d.lastDoneDate), d.intervalDays);
      } else {
        nextDueDate = addDays(new Date(), d.intervalDays);
      }
    }

    const lastDoneDate = d.lastDoneDate ? new Date(d.lastDoneDate) : null;

    const created = await db.reminder.create({
      data: {
        vehicleId: id,
        type: d.type,
        customType: d.customType ?? null,
        title: d.title,
        intervalKm: d.intervalKm ?? null,
        intervalDays: d.intervalDays ?? null,
        lastDoneKm: d.lastDoneKm ?? null,
        lastDoneDate,
        nextDueKm,
        nextDueDate,
        enabled: d.enabled,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[reminders POST]", e);
    return NextResponse.json({ error: "Error al registrar recordatorio" }, { status: 500 });
  }
}
