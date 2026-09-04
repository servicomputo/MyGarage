"use client";

import { useSession } from "next-auth/react";
import { useNav } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { AuthScreen } from "@/components/views/auth-screen";
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

export default function Home() {
  const { data: session, status } = useSession();
  const view = useNav((s) => s.view);

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
            <div className="h-5 w-5 rounded-md bg-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
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
