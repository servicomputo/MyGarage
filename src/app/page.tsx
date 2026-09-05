"use client";

import { useEffect, useRef, useState } from "react";
import { useNav } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { VehiclesView } from "@/components/views/vehicles-view";
import { VehicleDetailView } from "@/components/views/vehicle-detail-view";
import { AddVehicleView } from "@/components/views/add-vehicle-view";
import { QuickRegisterView } from "@/components/views/quick-register-view";
import { ExpensesView } from "@/components/views/expenses-view";
import { MoreView } from "@/components/views/more-view";
import { RemindersView } from "@/components/views/reminders-view";
import { HistoryView } from "@/components/views/history-view";
import { DocumentsView } from "@/components/views/documents-view";
import { SearchView } from "@/components/views/search-view";
import { InsightsView } from "@/components/views/insights-view";
import { FuelView } from "@/components/views/fuel-view";
import { FormView } from "@/components/views/form-view";
import { useVehicles, useSeedDemo } from "@/lib/queries";
import { SplashScreen } from "@/components/splash-screen";

const SPLASH_MIN_DURATION = 2500; // 2.5s para que se aprecien las ondas y el logo

export default function Home() {
  const view = useNav((s) => s.view);
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const seed = useSeedDemo();
  const seededRef = useRef(false);

  // Estado del splash: se muestra al inicio siempre (no usar sessionStorage)
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
       
      setShowSplash(false);
    }, SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Auto-cargar datos de ejemplo la primera vez si no hay vehículos
  useEffect(() => {
    if (seededRef.current) return;
    if (vehicles && vehicles.length === 0 && !seed.isPending) {
      seededRef.current = true;
      seed.mutate();
    }
  }, [vehicles, seed]);

  // Splash inicial: mientras carga O durante el mínimo de tiempo
  if (showSplash || (vehiclesLoading && !vehicles)) {
    return <SplashScreen />;
  }

  const isFormView = ["add-maintenance", "add-part", "add-expense", "add-fuel", "add-reminder", "add-document"].includes(view);

  const showBottomNav = ![
    "add-vehicle", "edit-vehicle", "quick-register",
    "add-maintenance", "add-part", "add-expense", "add-fuel", "add-reminder", "add-document",
    "search"
  ].includes(view);

  return (
    <AppShell showNav={showBottomNav} viewKey={view}>
      {view === "dashboard" && <DashboardView />}
      {view === "vehicles" && <VehiclesView />}
      {view === "vehicle-detail" && <VehicleDetailView />}
      {(view === "add-vehicle" || view === "edit-vehicle") && <AddVehicleView editing={view === "edit-vehicle"} />}
      {view === "quick-register" && <QuickRegisterView />}
      {view === "add-maintenance" && <QuickRegisterView preset="OTHER" />}
      {isFormView && view !== "add-maintenance" && <FormView kind={view as "add-part" | "add-expense" | "add-fuel" | "add-reminder" | "add-document"} />}
      {view === "expenses" && <ExpensesView />}
      {view === "more" && <MoreView />}
      {view === "reminders" && <RemindersView />}
      {view === "history" && <HistoryView />}
      {view === "documents" && <DocumentsView />}
      {view === "search" && <SearchView />}
      {view === "insights" && <InsightsView />}
      {view === "fuel" && <FuelView />}
    </AppShell>
  );
}
