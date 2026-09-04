"use client";

import { useVehicles } from "@/lib/queries";
import { useNav, openVehicle, openQuickRegister } from "@/lib/store";
import { formatMileage, formatCurrency, getVehicleStatus } from "@/lib/format";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, StatusBadge } from "@/components/ui-bits";
import { Plus, ChevronRight, Car, Loader2, Search } from "lucide-react";

export function VehiclesView() {
  const { data, isLoading } = useVehicles();
  const setView = useNav((s) => s.setView);

  return (
    <div className="min-h-screen">
      <TopBar
        title="Mis vehículos"
        right={
          <button onClick={() => setView("search")} className="grid place-items-center h-9 w-9 rounded-full hover:bg-muted tap-feedback" aria-label="Buscar">
            <Search className="h-5 w-5" />
          </button>
        }
      />
      <div className="px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            emoji="🚗"
            title="Sin vehículos"
            description="Agrega tu primer vehículo para empezar a llevar el control."
            action={
              <Button onClick={() => setView("add-vehicle")} className="h-11">
                <Plus className="mr-2 h-4 w-4" /> Agregar vehículo
              </Button>
            }
          />
        ) : (
          <>
            {data.map((v) => {
              const reminders = v.nextReminder ? [v.nextReminder] : [];
              const st = getVehicleStatus(reminders, v.mileage);
              return (
                <Card
                  key={v.id}
                  className="overflow-hidden cursor-pointer tap-feedback animate-fade-up"
                  onClick={() => openVehicle(v.id)}
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative h-24 w-32 rounded-lg overflow-hidden bg-muted shrink-0">
                      {v.photo ? (
                         
                        <img src={v.photo} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{v.make} {v.model}</h3>
                          <p className="text-xs text-muted-foreground">{v.year}{v.color ? ` · ${v.color}` : ""}{v.plates ? ` · ${v.plates}` : ""}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      <div className="mt-auto space-y-1">
                        <p className="text-sm font-semibold">{formatMileage(v.mileage)}</p>
                        <StatusBadge status={st.status} label={st.label} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-t divide-x text-center">
                    <div className="p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Servicios</p>
                      <p className="text-sm font-semibold">{v._count?.maintenances ?? 0}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Gasto total</p>
                      <p className="text-sm font-semibold">{formatCurrency(v.totalSpend)}</p>
                    </div>
                    <button
                      className="p-2 hover:bg-muted/40 tap-feedback"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickRegister(v.id);
                      }}
                    >
                      <p className="text-[10px] uppercase text-primary">Registrar</p>
                      <Plus className="h-4 w-4 mx-auto text-primary" />
                    </button>
                  </div>
                </Card>
              );
            })}
            <Button variant="outline" className="w-full h-11" onClick={() => setView("add-vehicle")}>
              <Plus className="mr-2 h-4 w-4" /> Agregar otro vehículo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
