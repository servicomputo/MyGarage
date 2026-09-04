import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

const fuelSchema = z.object({
  date: z.string().nullable().optional(),
  mileage: z.number().int().min(0),
  liters: z.number().min(0),
  pricePerL: z.number().min(0),
  total: z.number().min(0).nullable().optional(),
  fuelType: z.string().default("REGULAR"),
  station: z.string().nullable().optional(),
  fullTank: z.boolean().default(true),
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
  const items = await db.fueling.findMany({
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
    const parsed = fuelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const total = d.total ?? d.liters * d.pricePerL;
    const date = d.date ? parseDateInput(d.date) : new Date();

    const created = await db.$transaction(async (tx) => {
      // Actualizar kilometraje del vehículo si el de la carga es mayor
      if (d.mileage > vehicle.mileage) {
        await tx.vehicle.update({
          where: { id },
          data: { mileage: d.mileage },
        });
      }
      const fueling = await tx.fueling.create({
        data: {
          vehicleId: id,
          date,
          mileage: d.mileage,
          liters: d.liters,
          pricePerL: d.pricePerL,
          total,
          fuelType: d.fuelType,
          station: d.station ?? null,
          fullTank: d.fullTank,
        },
      });
      // Crear gasto asociado automáticamente
      await tx.expense.create({
        data: {
          vehicleId: id,
          category: "FUEL",
          title: `Carga de combustible - ${d.fuelType}`,
          amount: total,
          date,
          notes: d.station ? `Estación: ${d.station}` : null,
        },
      });
      return fueling;
    });

    return NextResponse.json(created);
  } catch (e) {
    console.error("[fuel POST]", e);
    return NextResponse.json({ error: "Error al registrar carga de combustible" }, { status: 500 });
  }
}
