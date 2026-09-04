"use client";

import { useState } from "react";
import { useSearch } from "@/lib/queries";
import { useNav, openVehicle } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui-bits";
import { Search as SearchIcon, Loader2, X, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate, formatMileage } from "@/lib/format";
import { getMaintenanceType, getPartCategory, getExpenseCategory, getDocumentType } from "@/lib/constants";

export function SearchView() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useSearch(q);
  const goBack = useNav((s) => s.goBack);
  const total = (data?.maintenances.length ?? 0) + (data?.parts.length ?? 0) + (data?.expenses.length ?? 0) + (data?.documents.length ?? 0);

  return (
    <div className="min-h-screen">
      <TopBar title="Buscar" showBack />
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: batería, aceite, frenos..."
            className="w-full h-11 pl-9 pr-9 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {q.length < 2 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["aceite", "frenos", "batería", "llantas", "seguro"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQ(tag)}
                  className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-muted/70"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <EmptyState emoji="🔍" title="Sin resultados" description={`No encontramos registros para "${q}".`} />
        ) : (
          <div className="space-y-4">
            {data!.maintenances.length > 0 && (
              <Section title="Mantenimientos" count={data!.maintenances.length}>
                {data!.maintenances.map((m: any) => {
                  const t = getMaintenanceType(m.type);
                  return (
                    <button key={m.id} onClick={() => openVehicle(m.vehicleId)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left tap-feedback">
                      <span className="text-lg shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.customType || t.label}</p>
                        <p className="text-xs text-muted-foreground">{m.vehicleName} · {formatMileage(m.mileage)}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(m.totalCost)}</span>
                    </button>
                  );
                })}
              </Section>
            )}
            {data!.parts.length > 0 && (
              <Section title="Refacciones" count={data!.parts.length}>
                {data!.parts.map((p: any) => {
                  const cat = getPartCategory(p.category);
                  return (
                    <button key={p.id} onClick={() => openVehicle(p.vehicleId)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left tap-feedback">
                      <span className="text-lg shrink-0">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.vehicleName}{p.brand ? ` · ${p.brand}` : ""}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(p.cost)}</span>
                    </button>
                  );
                })}
              </Section>
            )}
            {data!.expenses.length > 0 && (
              <Section title="Gastos" count={data!.expenses.length}>
                {data!.expenses.map((e: any) => {
                  const cat = getExpenseCategory(e.category);
                  return (
                    <button key={e.id} onClick={() => openVehicle(e.vehicleId)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left tap-feedback">
                      <span className="text-lg shrink-0">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.vehicleName} · {formatDate(e.date)}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(e.amount)}</span>
                    </button>
                  );
                })}
              </Section>
            )}
            {data!.documents.length > 0 && (
              <Section title="Documentos" count={data!.documents.length}>
                {data!.documents.map((d: any) => {
                  const t = getDocumentType(d.type);
                  return (
                    <button key={d.id} onClick={() => openVehicle(d.vehicleId)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left tap-feedback">
                      <span className="text-lg shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.vehicleName} · {formatDate(d.date)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{title} ({count})</p>
      <Card className="overflow-hidden divide-y">{children}</Card>
    </div>
  );
}
