import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ maintenances: [], parts: [], expenses: [], documents: [] });
  }

  // SQLite LIKE is case-insensitive for ASCII, but we'll be safe
  const term = `%${q}%`;

  const vehicles = await db.vehicle.findMany({
    where: { userId: user.id },
    select: { id: true, make: true, model: true, year: true },
  });
  const vehicleIds = vehicles.map((v) => v.id);
  if (vehicleIds.length === 0) {
    return NextResponse.json({ maintenances: [], parts: [], expenses: [], documents: [] });
  }

  const vehicleNameMap = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model} ${v.year}`]));

  const [maintenances, parts, expenses, documents] = await Promise.all([
    db.maintenance.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        OR: [
          { type: { contains: term } },
          { customType: { contains: term } },
          { description: { contains: term } },
          { workshop: { contains: term } },
          { notes: { contains: term } },
        ],
      },
      take: 20,
      orderBy: { date: "desc" },
    }),
    db.part.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        OR: [
          { name: { contains: term } },
          { brand: { contains: term } },
          { partNumber: { contains: term } },
          { provider: { contains: term } },
        ],
      },
      take: 20,
      orderBy: { installDate: "desc" },
    }),
    db.expense.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        OR: [{ title: { contains: term } }, { notes: { contains: term } }],
      },
      take: 20,
      orderBy: { date: "desc" },
    }),
    db.document.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        OR: [{ title: { contains: term } }, { notes: { contains: term } }],
      },
      take: 20,
      orderBy: { date: "desc" },
    }),
  ]);

  const formatMaintenance = (m: typeof maintenances[number]) => ({
    id: m.id,
    vehicleId: m.vehicleId,
    vehicleName: vehicleNameMap.get(m.vehicleId) ?? "",
    type: m.type,
    customType: m.customType,
    description: m.description,
    workshop: m.workshop,
    date: m.date,
    mileage: m.mileage,
    totalCost: m.totalCost,
  });

  const formatPart = (p: typeof parts[number]) => ({
    id: p.id,
    vehicleId: p.vehicleId,
    vehicleName: vehicleNameMap.get(p.vehicleId) ?? "",
    name: p.name,
    brand: p.brand,
    partNumber: p.partNumber,
    category: p.category,
    installDate: p.installDate,
    cost: p.cost,
  });

  const formatExpense = (e: typeof expenses[number]) => ({
    id: e.id,
    vehicleId: e.vehicleId,
    vehicleName: vehicleNameMap.get(e.vehicleId) ?? "",
    title: e.title,
    category: e.category,
    amount: e.amount,
    date: e.date,
  });

  const formatDocument = (d: typeof documents[number]) => ({
    id: d.id,
    vehicleId: d.vehicleId,
    vehicleName: vehicleNameMap.get(d.vehicleId) ?? "",
    title: d.title,
    type: d.type,
    fileUrl: d.fileUrl,
    date: d.date,
  });

  return NextResponse.json({
    maintenances: maintenances.map(formatMaintenance),
    parts: parts.map(formatPart),
    expenses: expenses.map(formatExpense),
    documents: documents.map(formatDocument),
  });
}
