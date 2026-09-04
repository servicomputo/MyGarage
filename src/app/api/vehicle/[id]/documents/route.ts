import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

const documentSchema = z.object({
  type: z.string().default("OTHER"),
  title: z.string().min(1, "Título requerido"),
  fileUrl: z.string().min(1, "URL de archivo requerida"),
  fileType: z.string().default("image"),
  notes: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
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
  const items = await db.document.findMany({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
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
    const parsed = documentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const date = d.date ? parseDateInput(d.date) : new Date();
    const created = await db.document.create({
      data: {
        vehicleId: id,
        type: d.type,
        title: d.title,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        notes: d.notes ?? null,
        date,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[documents POST]", e);
    return NextResponse.json({ error: "Error al registrar documento" }, { status: 500 });
  }
}
