import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

const expenseSchema = z.object({
  category: z.string().default("OTHER"),
  title: z.string().min(1, "Título requerido"),
  amount: z.number().min(0, "Monto requerido"),
  date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");

   
  const where: any = { vehicleId: id };
  if (category) where.category = category;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const items = await db.expense.findMany({
    where,
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
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const date = d.date ? parseDateInput(d.date) : new Date();
    const created = await db.expense.create({
      data: {
        vehicleId: id,
        category: d.category,
        title: d.title,
        amount: d.amount,
        date,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[expenses POST]", e);
    return NextResponse.json({ error: "Error al registrar gasto" }, { status: 500 });
  }
}
