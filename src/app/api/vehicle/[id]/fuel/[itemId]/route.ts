import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

async function verifyAndGetFueling(id: string, itemId: string, userId: string) {
  const vehicle = await db.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) return { vehicle: null, fueling: null };
  const fueling = await db.fueling.findFirst({ where: { id: itemId, vehicleId: id } });
  return { vehicle, fueling };
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, fueling } = await verifyAndGetFueling(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!fueling) return NextResponse.json({ error: "Carga no encontrada" }, { status: 404 });
  try {
    await db.fueling.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[fuel DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
