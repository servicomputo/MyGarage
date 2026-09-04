import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  getMaintenanceType,
  getPartCategory,
  getExpenseCategory,
  getDocumentType,
} from "@/lib/constants";

type HistoryItem = {
  date: Date;
  kind: "maintenance" | "part" | "expense" | "fuel" | "document";
  data: {
    id: string;
    type?: string;
    category?: string;
    title: string;
    amount?: number;
    mileage?: number;
    icon: string;
     
    [key: string]: any;
  };
};

async function verifyVehicle(vehicleId: string, userId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const vehicle = await verifyVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [maintenances, parts, expenses, fuelings, documents] = await Promise.all([
    db.maintenance.findMany({ where: { vehicleId: id } }),
    db.part.findMany({ where: { vehicleId: id } }),
    db.expense.findMany({ where: { vehicleId: id } }),
    db.fueling.findMany({ where: { vehicleId: id } }),
    db.document.findMany({ where: { vehicleId: id } }),
  ]);

  const items: HistoryItem[] = [];

  for (const m of maintenances) {
    const opt = getMaintenanceType(m.type);
    items.push({
      date: m.date,
      kind: "maintenance",
      data: {
        id: m.id,
        type: m.type,
        title: m.customType ?? opt.label,
        amount: m.totalCost,
        mileage: m.mileage,
        icon: opt.emoji,
        description: m.description,
        workshop: m.workshop,
        notes: m.notes,
        raw: m,
      },
    });
  }

  for (const p of parts) {
    const opt = getPartCategory(p.category);
    items.push({
      date: p.installDate,
      kind: "part",
      data: {
        id: p.id,
        category: p.category,
        title: p.name,
        amount: p.cost,
        mileage: p.installMileage,
        icon: opt.emoji,
        brand: p.brand,
        partNumber: p.partNumber,
        raw: p,
      },
    });
  }

  for (const e of expenses) {
    const opt = getExpenseCategory(e.category);
    items.push({
      date: e.date,
      kind: "expense",
      data: {
        id: e.id,
        category: e.category,
        title: e.title,
        amount: e.amount,
        icon: opt.emoji,
        notes: e.notes,
        raw: e,
      },
    });
  }

  for (const f of fuelings) {
    items.push({
      date: f.date,
      kind: "fuel",
      data: {
        id: f.id,
        title: "Carga de combustible",
        amount: f.total,
        mileage: f.mileage,
        icon: "⛽",
        liters: f.liters,
        pricePerL: f.pricePerL,
        fuelType: f.fuelType,
        station: f.station,
        raw: f,
      },
    });
  }

  for (const d of documents) {
    const opt = getDocumentType(d.type);
    items.push({
      date: d.date,
      kind: "document",
      data: {
        id: d.id,
        type: d.type,
        title: d.title,
        icon: opt.emoji,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        notes: d.notes,
        raw: d,
      },
    });
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  return NextResponse.json(items.slice(0, 100));
}
