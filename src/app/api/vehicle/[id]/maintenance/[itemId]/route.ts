import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const updateSchema = z.object({
  type: z.string().min(1).optional(),
  customType: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  mileage: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  partsCost: z.number().min(0).optional(),
  laborCost: z.number().min(0).optional(),
  workshop: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.string().nullable().optional(),
  receipt: z.string().nullable().optional(),
});

async function verifyAndGetMaintenance(id: string, itemId: string, userId: string) {
  const vehicle = await db.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) return { vehicle: null, maintenance: null };
  const maintenance = await db.maintenance.findFirst({
    where: { id: itemId, vehicleId: id },
  });
  return { vehicle, maintenance };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, maintenance } = await verifyAndGetMaintenance(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!maintenance) return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const partsCost = d.partsCost ?? maintenance.partsCost;
    const laborCost = d.laborCost ?? maintenance.laborCost;
    const totalCost = partsCost + laborCost;
    const date = d.date ? new Date(d.date) : undefined;

    const updated = await db.maintenance.update({
      where: { id: itemId },
      data: {
        type: d.type,
        customType: d.customType !== undefined ? d.customType : undefined,
        date,
        mileage: d.mileage,
        description: d.description !== undefined ? d.description : undefined,
        partsCost: d.partsCost,
        laborCost: d.laborCost,
        totalCost,
        workshop: d.workshop !== undefined ? d.workshop : undefined,
        notes: d.notes !== undefined ? d.notes : undefined,
        photos: d.photos !== undefined ? d.photos : undefined,
        receipt: d.receipt !== undefined ? d.receipt : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[maintenance PUT]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, maintenance } = await verifyAndGetMaintenance(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!maintenance) return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
  try {
    await db.maintenance.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[maintenance DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
