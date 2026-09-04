import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  brand: z.string().nullable().optional(),
  partNumber: z.string().nullable().optional(),
  installDate: z.string().nullable().optional(),
  installMileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  provider: z.string().nullable().optional(),
  estimatedLifeKm: z.number().int().min(0).nullable().optional(),
  nextChangeKm: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

async function verifyAndGetPart(id: string, itemId: string, userId: string) {
  const vehicle = await db.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) return { vehicle: null, part: null };
  const part = await db.part.findFirst({ where: { id: itemId, vehicleId: id } });
  return { vehicle, part };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, part } = await verifyAndGetPart(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!part) return NextResponse.json({ error: "Refacción no encontrada" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    const installDate = d.installDate ? new Date(d.installDate) : undefined;

    // Recalcular nextChangeKm si se actualiza estimatedLifeKm o installMileage
    let nextChangeKm: number | null | undefined = undefined;
    const newInstallMileage = d.installMileage ?? part.installMileage;
    const newEstimated = d.estimatedLifeKm !== undefined ? d.estimatedLifeKm : part.estimatedLifeKm;
    if (d.nextChangeKm !== undefined) {
      nextChangeKm = d.nextChangeKm;
    } else if (newEstimated != null) {
      nextChangeKm = newInstallMileage + newEstimated;
    }

    const updated = await db.$transaction(async (tx) => {
      // Actualizar kilometraje del vehículo si aplica
      if (d.installMileage && d.installMileage > vehicle.mileage) {
        await tx.vehicle.update({
          where: { id },
          data: { mileage: d.installMileage },
        });
      }
      return tx.part.update({
        where: { id: itemId },
        data: {
          name: d.name,
          category: d.category,
          brand: d.brand !== undefined ? d.brand : undefined,
          partNumber: d.partNumber !== undefined ? d.partNumber : undefined,
          installDate,
          installMileage: d.installMileage,
          cost: d.cost,
          provider: d.provider !== undefined ? d.provider : undefined,
          estimatedLifeKm: d.estimatedLifeKm !== undefined ? d.estimatedLifeKm : undefined,
          nextChangeKm,
          notes: d.notes !== undefined ? d.notes : undefined,
          photo: d.photo !== undefined ? d.photo : undefined,
        },
      });
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[parts PUT]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, part } = await verifyAndGetPart(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!part) return NextResponse.json({ error: "Refacción no encontrada" }, { status: 404 });
  try {
    await db.part.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[parts DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
