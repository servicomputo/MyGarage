import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const vehicleUpdateSchema = z.object({
  photo: z.string().nullable().optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  version: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  plates: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  mileage: z.number().int().min(0).optional(),
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function getVehicleForUser(id: string, userId: string) {
  return db.vehicle.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await getVehicleForUser(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await getVehicleForUser(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = vehicleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const updated = await db.vehicle.update({
      where: { id },
      data: {
        ...d,
        photo: d.photo !== undefined ? d.photo : undefined,
        version: d.version !== undefined ? d.version : undefined,
        color: d.color !== undefined ? d.color : undefined,
        plates: d.plates !== undefined ? d.plates : undefined,
        vin: d.vin !== undefined ? d.vin : undefined,
        purchaseDate: d.purchaseDate !== undefined ? (d.purchaseDate ? new Date(d.purchaseDate) : null) : undefined,
        purchasePrice: d.purchasePrice !== undefined ? d.purchasePrice : undefined,
        notes: d.notes !== undefined ? d.notes : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[vehicle PUT]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await getVehicleForUser(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  try {
    await db.vehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vehicle DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
