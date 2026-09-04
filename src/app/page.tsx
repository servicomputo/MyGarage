"use client";

import { useEffect, useRef } from "react";
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
import { FormView } from "@/components/views/form-view";
import { useVehicles, useSeedDemo } from "@/lib/queries";
import { Car, Loader2 } from "lucide-react";

export default function Home() {
  const view = useNav((s) => s.view);
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const seed = useSeedDemo();
  const seededRef = useRef(false);

  // Auto-cargar datos de ejemplo la primera vez si no hay vehículos
  useEffect(() => {
    if (seededRef.current) return;
    if (vehicles && vehicles.length === 0 && !seed.isPending) {
      seededRef.current = true;
      seed.mutate();
    }
  }, [vehicles, seed]);

  // Splash inicial mientras cargan los datos
  if (vehiclesLoading && !vehicles) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30">
            <Car className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando tu garage...</p>
          </div>
        </div>
      </div>
    );
  }

  const isFormView = ["add-maintenance", "add-part", "add-expense", "add-fuel", "add-reminder", "add-document"].includes(view);

  const showBottomNav = ![
    "add-vehicle", "edit-vehicle", "quick-register",
    "add-maintenance", "add-part", "add-expense", "add-fuel", "add-reminder", "add-document",
    "search"
  ].includes(view);

  return (
    <AppShell showNav={showBottomNav}>
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
    </AppShell>
  );
}
