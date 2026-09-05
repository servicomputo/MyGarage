"use client";

import { create } from "zustand";

export type ViewName =
  | "dashboard"
  | "vehicles"
  | "vehicle-detail"
  | "add-vehicle"
  | "edit-vehicle"
  | "quick-register"
  | "add-maintenance"
  | "add-part"
  | "add-expense"
  | "add-fuel"
  | "add-reminder"
  | "add-document"
  | "expenses"
  | "reminders"
  | "history"
  | "documents"
  | "search"
  | "more"
  | "profile"
  | "insights"
  | "fuel";

interface NavState {
  view: ViewName;
  params: Record<string, string>;
  history: { view: ViewName; params: Record<string, string> }[];
  selectedVehicleId: string | null;
  setView: (view: ViewName, params?: Record<string, string>) => void;
  goBack: () => void;
  selectVehicle: (id: string | null) => void;
  reset: () => void;
}

export const useNav = create<NavState>((set, get) => ({
  view: "dashboard",
  params: {},
  history: [],
  selectedVehicleId: null,
  setView: (view, params = {}) =>
    set((state) => ({
      view,
      params,
      history: [...state.history, { view: state.view, params: state.params }].slice(-30),
    })),
  goBack: () =>
    set((state) => {
      if (state.history.length === 0) return { view: "dashboard", params: {}, history: [] };
      const last = state.history[state.history.length - 1];
      return {
        view: last.view,
        params: last.params,
        history: state.history.slice(0, -1),
      };
    }),
  selectVehicle: (id) => set({ selectedVehicleId: id }),
  reset: () => set({ view: "dashboard", params: {}, history: [], selectedVehicleId: null }),
}));

// Helper para abrir el detalle de un vehículo
export function openVehicle(id: string) {
  const { setView, selectVehicle } = useNav.getState();
  selectVehicle(id);
  setView("vehicle-detail", { id });
}

// Helper para abrir el registro rápido desde el FAB.
// Si no se pasa vehicleId, limpia el selectedVehicleId para forzar
// el selector de vehículo (no asumir el último usado).
export function openQuickRegister(vehicleId?: string) {
  const { setView, selectVehicle } = useNav.getState();
  if (vehicleId) {
    selectVehicle(vehicleId);
    setView("quick-register", { id: vehicleId });
  } else {
    // Sin vehículo específico → limpiar para mostrar selector
    selectVehicle(null);
    setView("quick-register", { id: "" });
  }
}
