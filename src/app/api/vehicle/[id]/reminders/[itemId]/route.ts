import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { addDays } from "@/lib/format";

const updateSchema = z.object({
  type: z.string().optional(),
  customType: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  intervalKm: z.number().int().min(0).nullable().optional(),
  intervalDays: z.number().int().min(0).nullable().optional(),
  lastDoneKm: z.number().int().min(0).nullable().optional(),
  lastDoneDate: z.string().nullable().optional(),
  nextDueKm: z.number().int().min(0).nullable().optional(),
  nextDueDate: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

async function verifyAndGetReminder(id: string, itemId: string, userId: string) {
  const vehicle = await db.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) return { vehicle: null, reminder: null };
  const reminder = await db.reminder.findFirst({ where: { id: itemId, vehicleId: id } });
  return { vehicle, reminder };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, reminder } = await verifyAndGetReminder(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!reminder) return NextResponse.json({ error: "Recordatorio no encontrado" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    // Recalcular nextDueKm si se actualiza intervalKm o lastDoneKm
    let nextDueKm: number | null | undefined = undefined;
    const newIntervalKm = d.intervalKm !== undefined ? d.intervalKm : reminder.intervalKm;
    const newLastDoneKm = d.lastDoneKm !== undefined ? d.lastDoneKm : reminder.lastDoneKm;
    if (d.nextDueKm !== undefined) {
      nextDueKm = d.nextDueKm;
    } else if (
      (d.intervalKm !== undefined || d.lastDoneKm !== undefined) &&
      newIntervalKm != null
    ) {
      if (newLastDoneKm != null) {
        nextDueKm = newLastDoneKm + newIntervalKm;
      } else {
        nextDueKm = vehicle.mileage + newIntervalKm;
      }
    }

    // Recalcular nextDueDate si se actualiza intervalDays o lastDoneDate
    let nextDueDate: Date | null | undefined = undefined;
    const newIntervalDays = d.intervalDays !== undefined ? d.intervalDays : reminder.intervalDays;
    const newLastDoneDateRaw =
      d.lastDoneDate !== undefined ? d.lastDoneDate : reminder.lastDoneDate;
    const newLastDoneDate = newLastDoneDateRaw ? new Date(newLastDoneDateRaw) : null;

    if (d.nextDueDate !== undefined) {
      nextDueDate = d.nextDueDate ? new Date(d.nextDueDate) : null;
    } else if (
      (d.intervalDays !== undefined || d.lastDoneDate !== undefined) &&
      newIntervalDays != null
    ) {
      if (newLastDoneDate) {
        nextDueDate = addDays(newLastDoneDate, newIntervalDays);
      } else {
        nextDueDate = addDays(new Date(), newIntervalDays);
      }
    }

    const lastDoneDate = d.lastDoneDate !== undefined
      ? (d.lastDoneDate ? new Date(d.lastDoneDate) : null)
      : undefined;

    const updated = await db.reminder.update({
      where: { id: itemId },
      data: {
        type: d.type,
        customType: d.customType !== undefined ? d.customType : undefined,
        title: d.title,
        intervalKm: d.intervalKm !== undefined ? d.intervalKm : undefined,
        intervalDays: d.intervalDays !== undefined ? d.intervalDays : undefined,
        lastDoneKm: d.lastDoneKm !== undefined ? d.lastDoneKm : undefined,
        lastDoneDate,
        nextDueKm,
        nextDueDate,
        enabled: d.enabled,
        notes: d.notes !== undefined ? d.notes : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[reminders PUT]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, reminder } = await verifyAndGetReminder(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!reminder) return NextResponse.json({ error: "Recordatorio no encontrado" }, { status: 404 });
  try {
    await db.reminder.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reminders DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
