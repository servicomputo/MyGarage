"use client";

import { useDashboard } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui-bits";
import { formatDate } from "@/lib/format";
import { getDocumentType, colorClasses } from "@/lib/constants";
import { Loader2, FileText, Plus } from "lucide-react";

export function DocumentsView() {
  const { data: dash, isLoading } = useDashboard();
  const setView = useNav((s) => s.setView);

  if (isLoading || !dash) {
    return (
      <div className="min-h-screen">
        <TopBar title="Documentos" />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Para mostrar todos los documentos, navegamos al vehículo y su pestaña docs.
  // Aquí mostramos los vehículos con un atajo y actividad reciente de documentos.
  const docActivity = dash.recentActivity.filter((a) => a.kind === "document");

  return (
    <div className="min-h-screen pb-4">
      <TopBar title="Documentos" />
      <div className="px-4 py-3 space-y-4">
        {dash.vehicles.length === 0 ? (
          <EmptyState emoji="📎" title="Sin documentos" description="Agrega un vehículo para empezar a guardar documentos." />
        ) : (
          <>
            <Card className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Documentos por vehículo:</p>
              <div className="space-y-1">
                {dash.vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => openVehicle(v.id)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted tap-feedback"
                  >
                    <div className="h-8 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {v.photo ? (
                         
                        <img src={v.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-sm">🚗</div>
                      )}
                    </div>
                    <span className="text-sm font-medium flex-1 text-left truncate">{v.make} {v.model}</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </Card>

            {docActivity.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Documentos recientes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {docActivity.map((item, i) => {
                    const d = item.data;
                    const t = getDocumentType(d.type);
                    return (
                      <Card key={i} className="overflow-hidden cursor-pointer tap-feedback" onClick={() => item.vehicle && openVehicle(item.vehicle.id)}>
                        <div className="aspect-[4/3] bg-muted">
                          { }
                          <img src={d.fileUrl} alt={d.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-2">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{t.emoji}</span>
                            <p className="text-xs font-medium truncate flex-1">{d.title}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.vehicle ? `${item.vehicle.make}` : ""} · {formatDate(d.date)}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
