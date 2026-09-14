"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isCapacitor, offlineDB } from "@/lib/offline-db";
import { round2 } from "@/lib/format";

// === Fetch helper (solo para navegador con servidor) ===
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || j.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  get: <T>(url: string) => fetchJson(url) as Promise<T>,
  post: <T>(url: string, body: unknown) =>
    fetchJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) as Promise<T>,
  put: <T>(url: string, body: unknown) =>
    fetchJson(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) as Promise<T>,
  del: <T>(url: string) => fetchJson(url, { method: "DELETE" }) as Promise<T>,
};

// === Types ===
export interface User { id: string; email: string; name?: string | null; }
export interface Vehicle {
  id: string; userId: string; photo?: string | null;
  make: string; model: string; year: number;
  version?: string | null; color?: string | null;
  plates?: string | null; vin?: string | null;
  mileage: number; purchaseDate?: string | null; purchasePrice?: number | null;
  notes?: string | null; createdAt: string; updatedAt: string;
}
export interface VehicleWithMeta extends Vehicle {
  _count?: { maintenances: number; parts: number; expenses: number };
  totalSpend: number;
  nextReminder?: any;
  lastMaintenance?: Maintenance | null;
  fuelStats?: { fuelingCount: number; totalLiters: number; totalFuelSpend: number; avgConsumption: number | null };
}
export interface Maintenance {
  id: string; vehicleId: string; type: string; customType?: string | null;
  date: string; mileage: number; description?: string | null;
  partsCost: number; laborCost: number; totalCost: number;
  workshop?: string | null; notes?: string | null;
  photos?: string | null; receipt?: string | null;
}
export interface Part {
  id: string; vehicleId: string; maintenanceId?: string | null;
  name: string; category: string; brand?: string | null; partNumber?: string | null;
  installDate: string; installMileage: number; cost: number;
  provider?: string | null; estimatedLifeKm?: number | null;
  nextChangeKm?: number | null; notes?: string | null; photo?: string | null;
}
export interface Expense {
  id: string; vehicleId: string; category: string; title: string;
  amount: number; date: string; notes?: string | null;
}
export interface Fueling {
  id: string; vehicleId: string; date: string; mileage: number;
  liters: number; pricePerL: number; total: number; fuelType: string;
  station?: string | null; fullTank: boolean;
}
export interface Reminder {
  id: string; vehicleId: string; type: string; customType?: string | null;
  title: string; intervalKm?: number | null; intervalDays?: number | null;
  lastDoneKm?: number | null; lastDoneDate?: string | null;
  nextDueKm?: number | null; nextDueDate?: string | null;
  enabled: boolean; notes?: string | null;
}
export interface VehicleDocument {
  id: string; vehicleId: string; type: string; title: string;
  fileUrl: string; fileType: string; notes?: string | null; date: string;
}
export interface HistoryItem {
  date: string; kind: "maintenance" | "part" | "expense" | "fuel" | "document";
  data: any;
}
export interface SearchResult {
  maintenances: any[]; parts: any[]; expenses: any[]; documents: any[];
}
export interface FuelStats {
  totalLiters: number;
  totalFuelSpend: number;
  litersThisMonth: number;
  spendThisMonth: number;
  litersThisYear: number;
  spendThisYear: number;
  avgConsumption: number | null;
  avgPricePerL: number;
  costPerKm: number | null;
  totalDistance: number;
  fuelingCount: number;
  lastFueling: Fueling | null;
  monthlyTrend: { month: string; liters: number; spend: number; kmPerL: number | null; distance: number }[];
  consumptionPoints: { date: string; mileage: number; kmPerL: number | null }[];
  fuelings: Fueling[];
}
export interface VehicleStats {
  totalSpend: number; thisMonth: number; thisYear: number;
  byCategory: { category: string; amount: number }[];
  maintenanceCount: number; lastMaintenance?: Maintenance | null;
  nextReminders: any[];
  partsCount: number;
  documentsCount?: number;
  fuelingCount?: number;
  overdueCount?: number;
  hasReminders?: boolean;
  fuelStats: { totalLiters: number; totalFuelSpend: number; avgConsumption: number | null; costPerKm: number | null };
  recentActivity: HistoryItem[];
}
export interface DashboardData {
  vehicles: any[];
  upcomingReminders: any[];
  totalSpendThisMonth: number; totalSpendThisYear: number; totalSpendAllTime: number;
  recentActivity: (HistoryItem & { vehicle?: Vehicle })[];
  greeting: string;
}

// === Offline helpers ===
function getOfflineVehiclesWithMeta(): VehicleWithMeta[] {
  const vehicles = offlineDB.getVehicles();
  return vehicles.map((v) => {
    const maintenance = offlineDB.getMaintenance(v.id);
    const expenses = offlineDB.getExpenses(v.id);
    const fuelings = offlineDB.getFuelings(v.id);
    const reminders = offlineDB.getReminders(v.id);
    const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
    const lastMaintenance = maintenance[0] ?? null;
    const enabledReminders = reminders.filter((r) => r.enabled);
    const nextReminder = enabledReminders[0] ?? null;
    return {
      ...v,
      _count: { maintenances: maintenance.length, parts: offlineDB.getParts(v.id).length, expenses: expenses.length },
      totalSpend,
      lastMaintenance,
      nextReminder,
      fuelStats: {
        fuelingCount: fuelings.length,
        totalLiters: fuelings.reduce((s, f) => s + f.liters, 0),
        totalFuelSpend: fuelings.reduce((s, f) => s + f.total, 0),
        avgConsumption: fuelings.length >= 2 ? null : null,
      },
    } as VehicleWithMeta;
  });
}

function getOfflineDashboard(): DashboardData {
  const vehicles = getOfflineVehiclesWithMeta();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  let totalSpendThisMonth = 0, totalSpendThisYear = 0, totalSpendAllTime = 0;
  const allReminders: any[] = [];
  const recentItems: any[] = [];

  for (const v of vehicles) {
    const expenses = offlineDB.getExpenses(v.id);
    const fuelings = offlineDB.getFuelings(v.id);
    const maintenance = offlineDB.getMaintenance(v.id);
    totalSpendAllTime += v.totalSpend;
    totalSpendThisMonth += expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);
    totalSpendThisYear += expenses.filter((e) => new Date(e.date) >= yearStart).reduce((s, e) => s + e.amount, 0);
    allReminders.push(...offlineDB.getReminders(v.id).filter((r) => r.enabled).map((r) => ({ ...r, vehicle: v })));
    for (const m of maintenance.slice(0, 5)) recentItems.push({ date: m.date, vehicleId: v.id, vehicle: v, kind: "maintenance", data: { id: m.id, type: m.type, title: m.customType || m.type, amount: m.totalCost, mileage: m.mileage } });
    for (const f of fuelings.slice(0, 5)) recentItems.push({ date: f.date, vehicleId: v.id, vehicle: v, kind: "fuel", data: { id: f.id, title: "Carga de combustible", amount: f.total, liters: f.liters } });
    for (const e of expenses.slice(0, 5)) recentItems.push({ date: e.date, vehicleId: v.id, vehicle: v, kind: "expense", data: { id: e.id, title: e.title, amount: e.amount } });
  }

  recentItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const h = now.getHours();
  const greeting = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return {
    vehicles,
    upcomingReminders: allReminders.slice(0, 10),
    totalSpendThisMonth,
    totalSpendThisYear,
    totalSpendAllTime,
    recentActivity: recentItems.slice(0, 8),
    greeting,
  };
}

function getOfflineVehicleStats(vehicleId: string): VehicleStats {
  const vehicles = offlineDB.getVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) throw new Error("No encontrado");

  const expenses = offlineDB.getExpenses(vehicleId);
  const maintenance = offlineDB.getMaintenance(vehicleId);
  const parts = offlineDB.getParts(vehicleId);
  const fuelings = offlineDB.getFuelings(vehicleId);
  const reminders = offlineDB.getReminders(vehicleId);
  const documents = offlineDB.getDocuments(vehicleId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;

  const totalLiters = fuelings.reduce((s, f) => s + f.liters, 0);
  const totalFuelSpend = fuelings.reduce((s, f) => s + f.total, 0);
  let avgConsumption: number | null = null;
  if (fuelings.length >= 2) {
    const sorted = [...fuelings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const distance = sorted[sorted.length - 1].mileage - sorted[0].mileage;
    const litersBetween = sorted.slice(1).reduce((s, f) => s + f.liters, 0);
    if (distance > 0 && litersBetween > 0) avgConsumption = round2(distance / litersBetween);
  }

  const recentActivity: HistoryItem[] = [];
  for (const m of maintenance) recentActivity.push({ date: m.date, kind: "maintenance", data: { id: m.id, type: m.type, title: m.customType ?? m.type, amount: m.totalCost, mileage: m.mileage } });
  for (const e of expenses) recentActivity.push({ date: e.date, kind: "expense", data: { id: e.id, title: e.title, amount: e.amount } });
  for (const f of fuelings) recentActivity.push({ date: f.date, kind: "fuel", data: { id: f.id, title: "Carga de combustible", amount: f.total, liters: f.liters } });
  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalSpend: round2(totalSpend),
    thisMonth: round2(expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0)),
    thisYear: round2(expenses.filter((e) => new Date(e.date) >= yearStart).reduce((s, e) => s + e.amount, 0)),
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount: round2(amount) })),
    maintenanceCount: maintenance.length,
    lastMaintenance: maintenance[0] ?? null,
    nextReminders: reminders.filter((r) => r.enabled).slice(0, 5),
    partsCount: parts.length,
    documentsCount: documents.length,
    fuelingCount: fuelings.length,
    overdueCount: 0,
    hasReminders: reminders.length > 0,
    fuelStats: { totalLiters: round2(totalLiters), totalFuelSpend: round2(totalFuelSpend), avgConsumption, costPerKm: totalSpend > 0 && vehicle.mileage > 0 ? round2(totalSpend / vehicle.mileage) : null },
    recentActivity: recentActivity.slice(0, 5),
  };
}

// === Hooks (detectan automáticamente si están en Capacitor) ===
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => isCapacitor() ? getOfflineDashboard() : api.get<DashboardData>("/api/dashboard"),
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => isCapacitor() ? getOfflineVehiclesWithMeta() : api.get<VehicleWithMeta[]>("/api/vehicles"),
  });
}

export function useVehicle(id: string | null | undefined) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) {
        const v = offlineDB.getVehicles().find((x) => x.id === id);
        if (!v) throw new Error("No encontrado");
        return v;
      }
      return api.get<Vehicle>(`/api/vehicle/${id}`);
    },
    enabled: !!id,
  });
}

export function useVehicleStats(id: string | null | undefined) {
  return useQuery({
    queryKey: ["vehicle-stats", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return getOfflineVehicleStats(id);
      return api.get<VehicleStats>(`/api/vehicle/${id}/stats`);
    },
    enabled: !!id,
  });
}

export function useVehicleFuelStats(id: string | null | undefined) {
  return useQuery({
    queryKey: ["fuel-stats", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) {
        // Calcular fuel stats offline
        const fuelings = offlineDB.getFuelings(id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const vehicle = offlineDB.getVehicles().find((v) => v.id === id);
        const totalLiters = fuelings.reduce((s, f) => s + f.liters, 0);
        const totalFuelSpend = fuelings.reduce((s, f) => s + f.total, 0);
        let avgConsumption: number | null = null;
        if (fuelings.length >= 2) {
          const distance = fuelings[fuelings.length - 1].mileage - fuelings[0].mileage;
          const litersBetween = fuelings.slice(1).reduce((s, f) => s + f.liters, 0);
          if (distance > 0 && litersBetween > 0) avgConsumption = round2(distance / litersBetween);
        }
        const totalDistance = fuelings.length >= 2 ? fuelings[fuelings.length - 1].mileage - fuelings[0].mileage : 0;
        return {
          totalLiters: round2(totalLiters), totalFuelSpend: round2(totalFuelSpend),
          litersThisMonth: 0, spendThisMonth: 0, litersThisYear: 0, spendThisYear: 0,
          avgConsumption, avgPricePerL: round2(totalLiters > 0 ? totalFuelSpend / totalLiters : 0),
          costPerKm: vehicle && totalFuelSpend > 0 && vehicle.mileage > 0 ? round2(totalFuelSpend / vehicle.mileage) : null,
          totalDistance, fuelingCount: fuelings.length,
          lastFueling: fuelings[fuelings.length - 1] ?? null,
          monthlyTrend: [], consumptionPoints: [], fuelings: fuelings.reverse(),
        } as FuelStats;
      }
      return api.get<FuelStats>(`/api/vehicle/${id}/fuel-stats`);
    },
    enabled: !!id,
  });
}

export function useVehicleMaintenance(id: string | null | undefined) {
  return useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getMaintenance(id);
      return api.get<Maintenance[]>(`/api/vehicle/${id}/maintenance`);
    },
    enabled: !!id,
  });
}

export function useVehicleParts(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parts", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getParts(id);
      return api.get<Part[]>(`/api/vehicle/${id}/parts`);
    },
    enabled: !!id,
  });
}

export function useVehicleExpenses(id: string | null | undefined) {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getExpenses(id);
      return api.get<Expense[]>(`/api/vehicle/${id}/expenses`);
    },
    enabled: !!id,
  });
}

export function useVehicleFuel(id: string | null | undefined) {
  return useQuery({
    queryKey: ["fuel", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getFuelings(id);
      return api.get<Fueling[]>(`/api/vehicle/${id}/fuel`);
    },
    enabled: !!id,
  });
}

export function useVehicleReminders(id: string | null | undefined) {
  return useQuery({
    queryKey: ["reminders", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getReminders(id);
      return api.get<Reminder[]>(`/api/vehicle/${id}/reminders`);
    },
    enabled: !!id,
  });
}

export function useVehicleDocuments(id: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) return offlineDB.getDocuments(id);
      return api.get<VehicleDocument[]>(`/api/vehicle/${id}/documents`);
    },
    enabled: !!id,
  });
}

export function useVehicleHistory(id: string | null | undefined) {
  return useQuery({
    queryKey: ["history", id],
    queryFn: () => {
      if (!id) throw new Error("No id");
      if (isCapacitor()) {
        const items: HistoryItem[] = [];
        for (const m of offlineDB.getMaintenance(id)) items.push({ date: m.date, kind: "maintenance", data: { id: m.id, type: m.type, title: m.customType || m.type, amount: m.totalCost, mileage: m.mileage } });
        for (const e of offlineDB.getExpenses(id)) items.push({ date: e.date, kind: "expense", data: { id: e.id, title: e.title, amount: e.amount } });
        for (const f of offlineDB.getFuelings(id)) items.push({ date: f.date, kind: "fuel", data: { id: f.id, title: "Carga de combustible", amount: f.total, liters: f.liters } });
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return api.get<HistoryItem[]>(`/api/vehicle/${id}/history`);
    },
    enabled: !!id,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => {
      if (isCapacitor()) {
        const result: SearchResult = { maintenances: [], parts: [], expenses: [], documents: [] };
        const vehicles = offlineDB.getVehicles();
        for (const v of vehicles) {
          for (const m of offlineDB.getMaintenance(v.id)) {
            if (m.type.toLowerCase().includes(q.toLowerCase()) || (m.description || "").toLowerCase().includes(q.toLowerCase())) {
              result.maintenances.push({ ...m, vehicleId: v.id, vehicleName: `${v.make} ${v.model}` });
            }
          }
          for (const e of offlineDB.getExpenses(v.id)) {
            if (e.title.toLowerCase().includes(q.toLowerCase())) {
              result.expenses.push({ ...e, vehicleId: v.id, vehicleName: `${v.make} ${v.model}` });
            }
          }
        }
        return result;
      }
      return api.get<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`);
    },
    enabled: q.length >= 2,
  });
}

// === Mutations ===
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createVehicle(data));
      return api.post<Vehicle>("/api/vehicles", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.updateVehicle(id, data) as Vehicle);
      return api.put<Vehicle>(`/api/vehicle/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteVehicle(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateMaintenance(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createMaintenance({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/maintenance`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["reminders", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreatePart(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createPart({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/parts`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useCreateExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createExpense({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/expenses`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateFuel(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createFueling({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/fuel`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuel", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateReminder(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createReminder({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/reminders`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateReminder(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      if (isCapacitor()) { offlineDB.updateReminder(id, data); return Promise.resolve({ ok: true }); }
      return api.put(`/api/vehicle/${vehicleId}/reminders/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteReminder(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteReminder(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/reminders/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isCapacitor()) return Promise.resolve(offlineDB.createDocument({ ...data, vehicleId }));
      return api.post(`/api/vehicle/${vehicleId}/documents`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useDeleteDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteDocument(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/documents/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useDeleteMaintenance(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteMaintenance(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/maintenance/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePart(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deletePart(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/parts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useDeleteExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteExpense(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/expenses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteFuel(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isCapacitor()) { offlineDB.deleteFueling(id); return Promise.resolve({ ok: true }); }
      return api.del(`/api/vehicle/${vehicleId}/fuel/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuel", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (isCapacitor()) { offlineDB.seedDemo(); return Promise.resolve({ ok: true }); }
      return api.post("/api/seed-demo", {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export type Doc = VehicleDocument;
