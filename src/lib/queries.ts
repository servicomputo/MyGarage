"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as Promise<T>,
  put: <T>(url: string, body: unknown) =>
    fetchJson(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as Promise<T>,
  del: <T>(url: string) => fetchJson(url, { method: "DELETE" }) as Promise<T>,
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.get<VehicleWithMeta[]>("/api/vehicles"),
  });
}

export function useVehicle(id: string | null | undefined) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => api.get<Vehicle>(`/api/vehicle/${id}`),
    enabled: !!id,
  });
}

export function useVehicleStats(id: string | null | undefined) {
  return useQuery({
    queryKey: ["vehicle-stats", id],
    queryFn: () => api.get<VehicleStats>(`/api/vehicle/${id}/stats`),
    enabled: !!id,
  });
}

export function useVehicleMaintenance(id: string | null | undefined) {
  return useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => api.get<Maintenance[]>(`/api/vehicle/${id}/maintenance`),
    enabled: !!id,
  });
}

export function useVehicleParts(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parts", id],
    queryFn: () => api.get<Part[]>(`/api/vehicle/${id}/parts`),
    enabled: !!id,
  });
}

export function useVehicleExpenses(id: string | null | undefined, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return useQuery({
    queryKey: ["expenses", id, from, to],
    queryFn: () => api.get<Expense[]>(`/api/vehicle/${id}/expenses?${params.toString()}`),
    enabled: !!id,
  });
}

export function useVehicleFuel(id: string | null | undefined) {
  return useQuery({
    queryKey: ["fuel", id],
    queryFn: () => api.get<Fueling[]>(`/api/vehicle/${id}/fuel`),
    enabled: !!id,
  });
}

export function useVehicleReminders(id: string | null | undefined) {
  return useQuery({
    queryKey: ["reminders", id],
    queryFn: () => api.get<Reminder[]>(`/api/vehicle/${id}/reminders`),
    enabled: !!id,
  });
}

export function useVehicleDocuments(id: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => api.get<Document[]>(`/api/vehicle/${id}/documents`),
    enabled: !!id,
  });
}

export function useVehicleHistory(id: string | null | undefined) {
  return useQuery({
    queryKey: ["history", id],
    queryFn: () => api.get<HistoryItem[]>(`/api/vehicle/${id}/history`),
    enabled: !!id,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });
}

// Mutations
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vehicle>) => api.post<Vehicle>("/api/vehicles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vehicle>) => api.put<Vehicle>(`/api/vehicle/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", id] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateMaintenance(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/maintenance`, data),
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
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/parts`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
    },
  });
}

export function useCreateExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/expenses`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateFuel(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/fuel`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuel", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateReminder(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/reminders`, data),
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
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/vehicle/${vehicleId}/reminders/${id}`, data),
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
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/reminders/${id}`),
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
    mutationFn: (data: any) => api.post(`/api/vehicle/${vehicleId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
    },
  });
}

export function useDeleteDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
    },
  });
}

export function useDeleteMaintenance(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/maintenance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePart(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/parts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
    },
  });
}

export function useDeleteExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteFuel(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicle/${vehicleId}/fuel/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuel", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats", vehicleId] });
      qc.invalidateQueries({ queryKey: ["history", vehicleId] });
    },
  });
}

export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/seed-demo", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Types
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
  nextReminder?: Reminder | null;
  lastMaintenance?: Maintenance | null;
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
export interface VehicleStats {
  totalSpend: number; thisMonth: number; thisYear: number;
  byCategory: { category: string; amount: number }[];
  maintenanceCount: number; lastMaintenance?: Maintenance | null;
  nextReminders: (Reminder & { status?: string; statusLabel?: string })[];
  partsCount: number;
  fuelStats: { totalLiters: number; totalFuelSpend: number; avgConsumption: number | null; costPerKm: number | null };
  recentActivity: HistoryItem[];
}
export interface DashboardData {
  vehicles: (VehicleWithMeta & { status?: string; statusLabel?: string })[];
  upcomingReminders: (Reminder & { vehicle?: Vehicle; status?: string; statusLabel?: string })[];
  totalSpendThisMonth: number; totalSpendThisYear: number; totalSpendAllTime: number;
  recentActivity: (HistoryItem & { vehicle?: Vehicle })[];
  greeting: string;
}

// Use Document alias (Document is a DOM global)
export type Doc = VehicleDocument;
