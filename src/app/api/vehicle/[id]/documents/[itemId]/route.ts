import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

async function verifyAndGetDocument(id: string, itemId: string, userId: string) {
  const vehicle = await db.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) return { vehicle: null, document: null };
  const document = await db.document.findFirst({ where: { id: itemId, vehicleId: id } });
  return { vehicle, document };
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id, itemId } = await params;
  const { vehicle, document } = await verifyAndGetDocument(id, itemId, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!document) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  try {
    await db.document.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[documents DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
