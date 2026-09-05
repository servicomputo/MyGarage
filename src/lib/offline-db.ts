/**
 * Capa de datos offline para Capacitor (APK).
 * Cuando la app corre dentro del APK (sin servidor Next.js),
 * usa localStorage para persistir datos en lugar de las API routes.
 * Cuando corre en el navegador con servidor, usa las APIs normales.
 */

// Detectar si estamos en Capacitor (APK) o en navegador con servidor
function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.() ||
         window.location.protocol === "capacitor:" ||
         window.location.protocol === "file:";
}

export { isCapacitor };

// === Tipos de datos (espejo del schema de Prisma) ===
export interface Vehicle {
  id: string;
  photo: string | null;
  make: string;
  model: string;
  year: number;
  version: string | null;
  color: string | null;
  plates: string | null;
  vin: string | null;
  mileage: number;
  purchaseDate: string | null;
  purchasePrice: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  customType: string | null;
  date: string;
  mileage: number;
  description: string | null;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  workshop: string | null;
  notes: string | null;
  photos: string | null;
  receipt: string | null;
}

export interface Part {
  id: string;
  vehicleId: string;
  maintenanceId: string | null;
  name: string;
  category: string;
  brand: string | null;
  partNumber: string | null;
  installDate: string;
  installMileage: number;
  cost: number;
  provider: string | null;
  estimatedLifeKm: number | null;
  nextChangeKm: number | null;
  notes: string | null;
  photo: string | null;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  notes: string | null;
}

export interface Fueling {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  liters: number;
  pricePerL: number;
  total: number;
  fuelType: string;
  station: string | null;
  fullTank: boolean;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  type: string;
  customType: string | null;
  title: string;
  intervalKm: number | null;
  intervalDays: number | null;
  lastDoneKm: number | null;
  lastDoneDate: string | null;
  nextDueKm: number | null;
  nextDueDate: string | null;
  enabled: boolean;
  notes: string | null;
}

export interface DocumentItem {
  id: string;
  vehicleId: string;
  type: string;
  title: string;
  fileUrl: string;
  fileType: string;
  notes: string | null;
  date: string;
}

// === Storage helpers ===
const PREFIX = "mg_";

function read<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const data = localStorage.getItem(PREFIX + key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// === API Offline ===
export const offlineDB = {
  // Vehicles
  getVehicles(): Vehicle[] {
    return read<Vehicle>("vehicles");
  },
  createVehicle(data: Partial<Vehicle>): Vehicle {
    const vehicles = read<Vehicle>("vehicles");
    const now = new Date().toISOString();
    const v: Vehicle = {
      id: uid(),
      photo: data.photo ?? null,
      make: data.make || "",
      model: data.model || "",
      year: data.year || new Date().getFullYear(),
      version: data.version ?? null,
      color: data.color ?? null,
      plates: data.plates ?? null,
      vin: data.vin ?? null,
      mileage: data.mileage ?? 0,
      purchaseDate: data.purchaseDate ?? null,
      purchasePrice: data.purchasePrice ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    vehicles.push(v);
    write("vehicles", vehicles);
    return v;
  },
  updateVehicle(id: string, data: Partial<Vehicle>): Vehicle | null {
    const vehicles = read<Vehicle>("vehicles");
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    vehicles[idx] = { ...vehicles[idx], ...data, updatedAt: new Date().toISOString() };
    write("vehicles", vehicles);
    return vehicles[idx];
  },
  deleteVehicle(id: string): void {
    write("vehicles", read<Vehicle>("vehicles").filter((v) => v.id !== id));
    write("maintenance", read<Maintenance>("maintenance").filter((m) => m.vehicleId !== id));
    write("parts", read<Part>("parts").filter((p) => p.vehicleId !== id));
    write("expenses", read<Expense>("expenses").filter((e) => e.vehicleId !== id));
    write("fuelings", read<Fueling>("fuelings").filter((f) => f.vehicleId !== id));
    write("reminders", read<Reminder>("reminders").filter((r) => r.vehicleId !== id));
    write("documents", read<DocumentItem>("documents").filter((d) => d.vehicleId !== id));
  },

  // Maintenance
  getMaintenance(vehicleId: string): Maintenance[] {
    return read<Maintenance>("maintenance")
      .filter((m) => m.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  createMaintenance(data: Partial<Maintenance>): Maintenance {
    const items = read<Maintenance>("maintenance");
    const totalCost = data.totalCost ?? (data.partsCost ?? 0) + (data.laborCost ?? 0);
    const m: Maintenance = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      type: data.type || "OTHER",
      customType: data.customType ?? null,
      date: data.date || new Date().toISOString(),
      mileage: data.mileage ?? 0,
      description: data.description ?? null,
      partsCost: data.partsCost ?? 0,
      laborCost: data.laborCost ?? 0,
      totalCost,
      workshop: data.workshop ?? null,
      notes: data.notes ?? null,
      photos: data.photos ?? null,
      receipt: data.receipt ?? null,
    };
    items.push(m);
    write("maintenance", items);
    // Actualizar kilometraje del vehículo si es mayor
    const vehicles = read<Vehicle>("vehicles");
    const vIdx = vehicles.findIndex((v) => v.id === m.vehicleId);
    if (vIdx !== -1 && m.mileage > vehicles[vIdx].mileage) {
      vehicles[vIdx].mileage = m.mileage;
      write("vehicles", vehicles);
    }
    // Crear gasto asociado
    if (totalCost > 0) {
      this.createExpense({
        vehicleId: m.vehicleId,
        category: "MAINTENANCE",
        title: m.customType || m.type,
        amount: totalCost,
        date: m.date,
      });
    }
    return m;
  },
  deleteMaintenance(id: string): void {
    write("maintenance", read<Maintenance>("maintenance").filter((m) => m.id !== id));
  },

  // Parts
  getParts(vehicleId: string): Part[] {
    return read<Part>("parts")
      .filter((p) => p.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.installDate).getTime() - new Date(a.installDate).getTime());
  },
  createPart(data: Partial<Part>): Part {
    const items = read<Part>("parts");
    const p: Part = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      maintenanceId: data.maintenanceId ?? null,
      name: data.name || "",
      category: data.category || "OTHER",
      brand: data.brand ?? null,
      partNumber: data.partNumber ?? null,
      installDate: data.installDate || new Date().toISOString(),
      installMileage: data.installMileage ?? 0,
      cost: data.cost ?? 0,
      provider: data.provider ?? null,
      estimatedLifeKm: data.estimatedLifeKm ?? null,
      nextChangeKm: data.nextChangeKm ?? (data.estimatedLifeKm ? (data.installMileage ?? 0) + data.estimatedLifeKm : null),
      notes: data.notes ?? null,
      photo: data.photo ?? null,
    };
    items.push(p);
    write("parts", items);
    // Actualizar kilometraje del vehículo
    const vehicles = read<Vehicle>("vehicles");
    const vIdx = vehicles.findIndex((v) => v.id === p.vehicleId);
    if (vIdx !== -1 && p.installMileage > vehicles[vIdx].mileage) {
      vehicles[vIdx].mileage = p.installMileage;
      write("vehicles", vehicles);
    }
    return p;
  },
  deletePart(id: string): void {
    write("parts", read<Part>("parts").filter((p) => p.id !== id));
  },

  // Expenses
  getExpenses(vehicleId: string): Expense[] {
    return read<Expense>("expenses")
      .filter((e) => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  createExpense(data: Partial<Expense>): Expense {
    const items = read<Expense>("expenses");
    const e: Expense = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      category: data.category || "OTHER",
      title: data.title || "",
      amount: data.amount ?? 0,
      date: data.date || new Date().toISOString(),
      notes: data.notes ?? null,
    };
    items.push(e);
    write("expenses", items);
    return e;
  },
  deleteExpense(id: string): void {
    write("expenses", read<Expense>("expenses").filter((e) => e.id !== id));
  },

  // Fuel
  getFuelings(vehicleId: string): Fueling[] {
    return read<Fueling>("fuelings")
      .filter((f) => f.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  createFueling(data: Partial<Fueling>): Fueling {
    const items = read<Fueling>("fuelings");
    const total = data.total ?? (data.liters ?? 0) * (data.pricePerL ?? 0);
    const f: Fueling = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      date: data.date || new Date().toISOString(),
      mileage: data.mileage ?? 0,
      liters: data.liters ?? 0,
      pricePerL: data.pricePerL ?? 0,
      total,
      fuelType: data.fuelType || "REGULAR",
      station: data.station ?? null,
      fullTank: data.fullTank ?? true,
    };
    items.push(f);
    write("fuelings", items);
    // Actualizar kilometraje y crear gasto
    const vehicles = read<Vehicle>("vehicles");
    const vIdx = vehicles.findIndex((v) => v.id === f.vehicleId);
    if (vIdx !== -1 && f.mileage > vehicles[vIdx].mileage) {
      vehicles[vIdx].mileage = f.mileage;
      write("vehicles", vehicles);
    }
    this.createExpense({
      vehicleId: f.vehicleId,
      category: "FUEL",
      title: "Carga de combustible",
      amount: total,
      date: f.date,
    });
    return f;
  },
  deleteFueling(id: string): void {
    write("fuelings", read<Fueling>("fuelings").filter((f) => f.id !== id));
  },

  // Reminders
  getReminders(vehicleId: string): Reminder[] {
    return read<Reminder>("reminders").filter((r) => r.vehicleId === vehicleId);
  },
  createReminder(data: Partial<Reminder>): Reminder {
    const items = read<Reminder>("reminders");
    const r: Reminder = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      type: data.type || "OTHER",
      customType: data.customType ?? null,
      title: data.title || "",
      intervalKm: data.intervalKm ?? null,
      intervalDays: data.intervalDays ?? null,
      lastDoneKm: data.lastDoneKm ?? null,
      lastDoneDate: data.lastDoneDate ?? null,
      nextDueKm: data.nextDueKm ?? null,
      nextDueDate: data.nextDueDate ?? null,
      enabled: data.enabled ?? true,
      notes: data.notes ?? null,
    };
    items.push(r);
    write("reminders", items);
    return r;
  },
  updateReminder(id: string, data: Partial<Reminder>): void {
    const items = read<Reminder>("reminders");
    const idx = items.findIndex((r) => r.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data };
      write("reminders", items);
    }
  },
  deleteReminder(id: string): void {
    write("reminders", read<Reminder>("reminders").filter((r) => r.id !== id));
  },

  // Documents
  getDocuments(vehicleId: string): DocumentItem[] {
    return read<DocumentItem>("documents").filter((d) => d.vehicleId === vehicleId);
  },
  createDocument(data: Partial<DocumentItem>): DocumentItem {
    const items = read<DocumentItem>("documents");
    const d: DocumentItem = {
      id: uid(),
      vehicleId: data.vehicleId || "",
      type: data.type || "OTHER",
      title: data.title || "",
      fileUrl: data.fileUrl || "",
      fileType: data.fileType || "image",
      notes: data.notes ?? null,
      date: data.date || new Date().toISOString(),
    };
    items.push(d);
    write("documents", items);
    return d;
  },
  deleteDocument(id: string): void {
    write("documents", read<DocumentItem>("documents").filter((d) => d.id !== id));
  },

  // Seed demo data
  seedDemo(): void {
    if (read<Vehicle>("vehicles").length > 0) return;
    const now = new Date();
    const monthsAgo = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 4).toISOString();
    const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

    // Vehículos
    const v1 = this.createVehicle({
      make: "Toyota", model: "Sienna", year: 2011, color: "Gris", plates: "ABC-123",
      mileage: 145000, photo: "/uploads/toyota-sienna-2011.jpg",
      purchaseDate: monthsAgo(36), purchasePrice: 180000, notes: "Familiar, uso diario",
    });
    const v2 = this.createVehicle({
      make: "Mitsubishi", model: "Montero", year: 2003, color: "Verde", plates: "XYZ-789",
      mileage: 220000, photo: "/uploads/mitsubishi-montero-2003.jpg",
      purchaseDate: monthsAgo(60), purchasePrice: 95000, notes: "Vehículo secundario",
    });

    // Mantenimientos Toyota
    this.createMaintenance({ vehicleId: v1.id, type: "OIL_CHANGE", date: monthsAgo(1), mileage: 144500, description: "Cambio de aceite sintético 5W-30", partsCost: 800, laborCost: 300, totalCost: 1100, workshop: "Toyota Service Center" });
    this.createMaintenance({ vehicleId: v1.id, type: "GENERAL_SERVICE", date: monthsAgo(4), mileage: 142000, description: "Afinación mayor", partsCost: 2500, laborCost: 1200, totalCost: 3700, workshop: "Auto Service Martínez" });
    this.createMaintenance({ vehicleId: v1.id, type: "BRAKES", date: monthsAgo(8), mileage: 138000, description: "Cambio de balatas delanteras", partsCost: 1500, laborCost: 500, totalCost: 2000, workshop: "Frenos Express" });

    // Combustible Toyota
    this.createFueling({ vehicleId: v1.id, date: monthsAgo(0), mileage: 144800, liters: 45, pricePerL: 22.5, total: 1012.5, fuelType: "REGULAR", station: "PEMEX", fullTank: true });
    this.createFueling({ vehicleId: v1.id, date: monthsAgo(1), mileage: 144000, liters: 42, pricePerL: 22.0, total: 924, fuelType: "REGULAR", station: "PEMEX", fullTank: true });
    this.createFueling({ vehicleId: v1.id, date: monthsAgo(2), mileage: 142800, liters: 40, pricePerL: 21.8, total: 872, fuelType: "REGULAR", station: "Shell", fullTank: true });
    this.createFueling({ vehicleId: v1.id, date: monthsAgo(3), mileage: 141500, liters: 44, pricePerL: 21.5, total: 946, fuelType: "REGULAR", station: "PEMEX", fullTank: true });

    // Refacciones Toyota
    this.createPart({ vehicleId: v1.id, name: "Filtro de aceite", category: "FILTER", brand: "Bosch", partNumber: "XYZ123", installMileage: 144500, cost: 350, provider: "AutoZone", estimatedLifeKm: 5000 });

    // Recordatorios Toyota
    this.createReminder({ vehicleId: v1.id, type: "OIL_CHANGE", title: "Cambio de aceite", intervalKm: 5000, intervalDays: 180, lastDoneKm: 144500, lastDoneDate: monthsAgo(1), nextDueKm: 149500, nextDueDate: monthsAgo(-5), enabled: true });
    this.createReminder({ vehicleId: v1.id, type: "VERIFICATION", title: "Verificación ambiental", intervalDays: 180, lastDoneDate: monthsAgo(5), nextDueDate: daysAhead(30), enabled: true });

    // Gasto adicional Toyota
    this.createExpense({ vehicleId: v1.id, category: "INSURANCE", title: "Póliza de seguro anual", amount: 8500, date: monthsAgo(2) });

    // Mantenimientos Mitsubishi
    this.createMaintenance({ vehicleId: v2.id, type: "OIL_CHANGE", date: monthsAgo(2), mileage: 218000, description: "Cambio de aceite mineral 20W-50", partsCost: 600, laborCost: 250, totalCost: 850, workshop: "Taller López" });
    this.createMaintenance({ vehicleId: v2.id, type: "TIRES", date: monthsAgo(6), mileage: 215000, description: "Cambio de 4 llantas 265/70 R16", partsCost: 6800, laborCost: 400, totalCost: 7200, workshop: "Llanteras del Norte" });

    // Combustible Mitsubishi
    this.createFueling({ vehicleId: v2.id, date: monthsAgo(0), mileage: 219500, liters: 60, pricePerL: 24.0, total: 1440, fuelType: "REGULAR", station: "PEMEX", fullTank: true });
    this.createFueling({ vehicleId: v2.id, date: monthsAgo(1), mileage: 217800, liters: 58, pricePerL: 23.7, total: 1374.6, fuelType: "REGULAR", station: "PEMEX", fullTank: true });

    // Recordatorios Mitsubishi
    this.createReminder({ vehicleId: v2.id, type: "OIL_CHANGE", title: "Cambio de aceite", intervalKm: 5000, intervalDays: 180, lastDoneKm: 218000, lastDoneDate: monthsAgo(2), nextDueKm: 223000, nextDueDate: monthsAgo(-4), enabled: true });
    this.createReminder({ vehicleId: v2.id, type: "TAX", title: "Tenencia anual", intervalDays: 365, lastDoneDate: monthsAgo(3), nextDueDate: daysAhead(273), enabled: true });
  },
};
