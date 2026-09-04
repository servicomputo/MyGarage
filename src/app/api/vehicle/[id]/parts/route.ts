import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

const partSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  category: z.string().default("OTHER"),
  brand: z.string().nullable().optional(),
  partNumber: z.string().nullable().optional(),
  installDate: z.string().nullable().optional(),
  installMileage: z.number().int().min(0),
  cost: z.number().min(0).default(0),
  provider: z.string().nullable().optional(),
  estimatedLifeKm: z.number().int().min(0).nullable().optional(),
  nextChangeKm: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  maintenanceId: z.string().nullable().optional(),
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
  const items = await db.part.findMany({
    where: { vehicleId: id },
    orderBy: { installDate: "desc" },
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
    const parsed = partSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    // Calcular nextChangeKm si no se provee pero hay estimatedLifeKm
    let nextChangeKm = d.nextChangeKm ?? null;
    if (nextChangeKm == null && d.estimatedLifeKm != null) {
      nextChangeKm = d.installMileage + d.estimatedLifeKm;
    }

    const installDate = d.installDate ? parseDateInput(d.installDate) : new Date();

    const created = await db.$transaction(async (tx) => {
      // Actualizar kilometraje del vehículo si el de la refacción es mayor
      if (d.installMileage > vehicle.mileage) {
        await tx.vehicle.update({
          where: { id },
          data: { mileage: d.installMileage },
        });
      }
      const part = await tx.part.create({
        data: {
          vehicleId: id,
          maintenanceId: d.maintenanceId ?? null,
          name: d.name,
          category: d.category,
          brand: d.brand ?? null,
          partNumber: d.partNumber ?? null,
          installDate,
          installMileage: d.installMileage,
          cost: d.cost,
          provider: d.provider ?? null,
          estimatedLifeKm: d.estimatedLifeKm ?? null,
          nextChangeKm,
          notes: d.notes ?? null,
          photo: d.photo ?? null,
        },
      });
      return part;
    });

    return NextResponse.json(created);
  } catch (e) {
    console.error("[parts POST]", e);
    return NextResponse.json({ error: "Error al registrar refacción" }, { status: 500 });
  }
}
