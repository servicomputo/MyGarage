import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const existing = await db.vehicle.count({ where: { userId: user.id } });
    if (existing > 0) {
      return NextResponse.json({ error: "Ya tienes vehículos" }, { status: 400 });
    }

    const now = new Date();
    const monthsAgo = (m: number) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - m);
      return d;
    };

    const created = await db.$transaction(async (tx) => {
      // Vehículo 1: Toyota Sienna 2011
      const v1 = await tx.vehicle.create({
        data: {
          userId: user.id,
          make: "Toyota",
          model: "Sienna",
          year: 2011,
          color: "Gris",
          plates: "ABC-123",
          mileage: 145000,
          purchaseDate: monthsAgo(36),
          purchasePrice: 180000,
          photo: "/uploads/toyota-sienna-2011.jpg",
          notes: "Familiar, uso diario",
        },
      });

      // Vehículo 2: Mitsubishi Montero 2003
      const v2 = await tx.vehicle.create({
        data: {
          userId: user.id,
          make: "Mitsubishi",
          model: "Montero",
          year: 2003,
          color: "Verde",
          plates: "XYZ-789",
          mileage: 220000,
          purchaseDate: monthsAgo(60),
          purchasePrice: 95000,
          photo: "/uploads/mitsubishi-montero-2003.jpg",
          notes: "Vehículo secundario, viajes largos",
        },
      });

      // === Toyota: mantenimientos ===
      const m1 = await tx.maintenance.create({
        data: {
          vehicleId: v1.id,
          type: "OIL_CHANGE",
          date: monthsAgo(1),
          mileage: 144500,
          description: "Cambio de aceite sintético 5W-30",
          partsCost: 800,
          laborCost: 300,
          totalCost: 1100,
          workshop: "Toyota Service Center",
          notes: "Próximo cambio en 5,000 km",
        },
      });

      await tx.maintenance.create({
        data: {
          vehicleId: v1.id,
          type: "GENERAL_SERVICE",
          date: monthsAgo(4),
          mileage: 142000,
          description: "Afinación mayor",
          partsCost: 2500,
          laborCost: 1200,
          totalCost: 3700,
          workshop: "Auto Service Martínez",
        },
      });

      await tx.maintenance.create({
        data: {
          vehicleId: v1.id,
          type: "BRAKES",
          date: monthsAgo(8),
          mileage: 138000,
          description: "Cambio de balatas delanteras",
          partsCost: 1500,
          laborCost: 500,
          totalCost: 2000,
          workshop: "Frenos Express",
        },
      });

      // === Toyota: refacciones ===
      await tx.part.create({
        data: {
          vehicleId: v1.id,
          maintenanceId: m1.id,
          name: "Filtro de aceite",
          category: "FILTER",
          brand: "Toyota OEM",
          partNumber: "TOY-FA-2024",
          installDate: monthsAgo(1),
          installMileage: 144500,
          cost: 350,
          provider: "Toyota Service Center",
          estimatedLifeKm: 5000,
          nextChangeKm: 149500,
        },
      });

      await tx.part.create({
        data: {
          vehicleId: v1.id,
          maintenanceId: m1.id,
          name: "Aceite motor 5W-30 sintético",
          category: "ENGINE",
          brand: "Mobil 1",
          partNumber: "MOB-5W30-1L",
          installDate: monthsAgo(1),
          installMileage: 144500,
          cost: 450,
          provider: "AutoZone",
          estimatedLifeKm: 5000,
          nextChangeKm: 149500,
        },
      });

      // === Toyota: gastos ===
      await tx.expense.create({
        data: {
          vehicleId: v1.id,
          category: "MAINTENANCE",
          title: "Cambio de aceite",
          amount: 1100,
          date: monthsAgo(1),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v1.id,
          category: "MAINTENANCE",
          title: "Afinación mayor",
          amount: 3700,
          date: monthsAgo(4),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v1.id,
          category: "INSURANCE",
          title: "Póliza de seguro anual",
          amount: 8500,
          date: monthsAgo(2),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v1.id,
          category: "FUEL",
          title: "Carga de combustible - REGULAR",
          amount: 850,
          date: monthsAgo(0),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v1.id,
          category: "WASH",
          title: "Lavado y encerado",
          amount: 250,
          date: monthsAgo(0),
        },
      });

      // === Toyota: combustibles ===
      await tx.fueling.create({
        data: {
          vehicleId: v1.id,
          date: monthsAgo(0),
          mileage: 144800,
          liters: 45,
          pricePerL: 22.5,
          total: 1012.5,
          fuelType: "REGULAR",
          station: "PEMEX",
          fullTank: true,
        },
      });
      await tx.fueling.create({
        data: {
          vehicleId: v1.id,
          date: monthsAgo(1),
          mileage: 144000,
          liters: 42,
          pricePerL: 22.0,
          total: 924,
          fuelType: "REGULAR",
          station: "PEMEX",
          fullTank: true,
        },
      });

      // === Toyota: recordatorios ===
      await tx.reminder.create({
        data: {
          vehicleId: v1.id,
          type: "OIL_CHANGE",
          title: "Cambio de aceite",
          intervalKm: 5000,
          intervalDays: 180,
          lastDoneKm: 144500,
          lastDoneDate: monthsAgo(1),
          nextDueKm: 149500,
          nextDueDate: monthsAgo(-5),
          enabled: true,
        },
      });
      await tx.reminder.create({
        data: {
          vehicleId: v1.id,
          type: "VERIFICATION",
          title: "Verificación ambiental",
          intervalDays: 180,
          lastDoneDate: monthsAgo(5),
          nextDueDate: monthsAgo(-1),
          enabled: true,
        },
      });
      await tx.reminder.create({
        data: {
          vehicleId: v1.id,
          type: "INSURANCE",
          title: "Renovación de seguro",
          intervalDays: 365,
          lastDoneDate: monthsAgo(2),
          nextDueDate: monthsAgo(-10),
          enabled: true,
        },
      });

      // === Toyota: documentos ===
      await tx.document.create({
        data: {
          vehicleId: v1.id,
          type: "INVOICE",
          title: "Factura original",
          fileUrl: "/uploads/vehicle-default.jpg",
          fileType: "image",
          date: monthsAgo(36),
        },
      });
      await tx.document.create({
        data: {
          vehicleId: v1.id,
          type: "INSURANCE",
          title: "Póliza de seguro 2024",
          fileUrl: "/uploads/vehicle-default.jpg",
          fileType: "image",
          date: monthsAgo(2),
        },
      });

      // === Mitsubishi: mantenimientos ===
      await tx.maintenance.create({
        data: {
          vehicleId: v2.id,
          type: "OIL_CHANGE",
          date: monthsAgo(2),
          mileage: 218000,
          description: "Cambio de aceite mineral 20W-50",
          partsCost: 600,
          laborCost: 250,
          totalCost: 850,
          workshop: "Taller López",
        },
      });

      await tx.maintenance.create({
        data: {
          vehicleId: v2.id,
          type: "TIRES",
          date: monthsAgo(6),
          mileage: 215000,
          description: "Cambio de 4 llantas 265/70 R16",
          partsCost: 6800,
          laborCost: 400,
          totalCost: 7200,
          workshop: "Llanteras del Norte",
        },
      });

      // === Mitsubishi: gastos ===
      await tx.expense.create({
        data: {
          vehicleId: v2.id,
          category: "TIRES",
          title: "Cambio de llantas",
          amount: 7200,
          date: monthsAgo(6),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v2.id,
          category: "MAINTENANCE",
          title: "Cambio de aceite",
          amount: 850,
          date: monthsAgo(2),
        },
      });
      await tx.expense.create({
        data: {
          vehicleId: v2.id,
          category: "TAXES",
          title: "Tenencia 2024",
          amount: 1500,
          date: monthsAgo(3),
        },
      });

      // === Mitsubishi: combustibles ===
      await tx.fueling.create({
        data: {
          vehicleId: v2.id,
          date: monthsAgo(0),
          mileage: 219500,
          liters: 60,
          pricePerL: 24.0,
          total: 1440,
          fuelType: "REGULAR",
          station: "PEMEX",
          fullTank: true,
        },
      });

      // === Mitsubishi: recordatorios ===
      await tx.reminder.create({
        data: {
          vehicleId: v2.id,
          type: "OIL_CHANGE",
          title: "Cambio de aceite",
          intervalKm: 5000,
          intervalDays: 180,
          lastDoneKm: 218000,
          lastDoneDate: monthsAgo(2),
          nextDueKm: 223000,
          nextDueDate: monthsAgo(-4),
          enabled: true,
        },
      });
      await tx.reminder.create({
        data: {
          vehicleId: v2.id,
          type: "TAX",
          title: "Tenencia anual",
          intervalDays: 365,
          lastDoneDate: monthsAgo(3),
          nextDueDate: monthsAgo(-9),
          enabled: true,
        },
      });

      // === Mitsubishi: documentos ===
      await tx.document.create({
        data: {
          vehicleId: v2.id,
          type: "REGISTRATION",
          title: "Tarjeta de circulación",
          fileUrl: "/uploads/vehicle-default.jpg",
          fileType: "image",
          date: monthsAgo(12),
        },
      });

      return { v1, v2 };
    });

    return NextResponse.json({
      ok: true,
      message: "Vehículos de demostración creados",
      created: {
        vehicles: 2,
        maintenances: 5,
        parts: 2,
        expenses: 8,
        fuelings: 3,
        reminders: 5,
        documents: 3,
      },
    });
  } catch (e) {
    console.error("[seed-demo POST]", e);
    return NextResponse.json({ error: "Error al crear datos demo" }, { status: 500 });
  }
}
