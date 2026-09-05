"use client";

import { useState, useEffect } from "react";
import { useVehicles, useCreateMaintenance, useVehicle } from "@/lib/queries";
import { useNav } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/photo-upload";
import { MAINTENANCE_TYPES, colorClasses } from "@/lib/constants";
import { formatMileage, formatCurrency, todayLocalISO, getReminderStatus, STATUS_COLOR, type ReminderStatus } from "@/lib/format";
import { ChevronDown, ChevronRight, Loader2, Check } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function QuickRegisterView({ preset }: { preset?: string }) {
  const { selectedVehicleId, params, setView, selectVehicle } = useNav();
  const vehicleId = selectedVehicleId || params.id;
  const { data: vehicles } = useVehicles();
  const { data: vehicle } = useVehicle(vehicleId);
  const createMaintenance = useCreateMaintenance(vehicleId ?? "");

  const [selectedType, setSelectedType] = useState<string | null>(preset ?? null);
  const [step, setStep] = useState<"type" | "details">(preset ? "details" : "type");
  const [mileage, setMileage] = useState<number>(0);
  const [mileageInitialized, setMileageInitialized] = useState(false);

  // Sincroniza el kilometraje del vehículo cuando se carga
  useEffect(() => {
    if (vehicle && !mileageInitialized) {
       
      setMileage(vehicle.mileage);
       
      setMileageInitialized(true);
    }
  }, [vehicle, mileageInitialized]);

  const [date, setDate] = useState<string>(todayLocalISO());
  const [description, setDescription] = useState("");
  const [totalCost, setTotalCost] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [partsCost, setPartsCost] = useState<string>("");
  const [laborCost, setLaborCost] = useState<string>("");
  const [workshop, setWorkshop] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Si no hay vehículo seleccionado, mostrar selector
  if (!vehicleId || !vehicle) {
    return (
      <div className="min-h-screen">
        <TopBar title="Registrar" showBack />
        <div className="px-4 py-3">
          {/* Header animado */}
          <div className="text-center mb-4 animate-fade-up">
            <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary/10 mb-2">
              <span className="text-2xl animate-float">🚗</span>
            </div>
            <h2 className="text-lg font-bold">¿Qué vehículo?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Selecciona el vehículo para registrar el servicio</p>
          </div>

          {/* Tarjetas de vehículo con foto de fondo */}
          <div className="space-y-3 stagger">
            {(vehicles ?? []).map((v) => {
              const nextReminder = v.nextReminder;
              const statusInfo = nextReminder
                ? (nextReminder as any).status && typeof (nextReminder as any).status === "object"
                  ? (nextReminder as any).status
                  : getReminderStatus(nextReminder, v.mileage)
                : null;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    selectVehicle(v.id);
                    setMileage(v.mileage);
                  }}
                  className="relative w-full h-32 rounded-2xl overflow-hidden tap-feedback card-elevated group animate-fade-up block text-left"
                >
                  {/* Foto de fondo */}
                  {v.photo ? (
                    <img src={v.photo} alt={`${v.make} ${v.model}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-active:scale-95" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-5xl bg-gradient-to-br from-muted to-muted/50">🚗</div>
                  )}

                  {/* Overlay con degradado para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                  {/* Brillo que cruza al hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {/* Contenido sobre la foto */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="text-white">
                        <p className="text-xs opacity-80 font-medium">{v.year}</p>
                      </div>
                      {statusInfo && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[statusInfo.status as ReminderStatus]?.bg ?? "bg-gray-500/30"} ${STATUS_COLOR[statusInfo.status as ReminderStatus]?.text ?? "text-white"} backdrop-blur-sm`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[statusInfo.status as ReminderStatus]?.dot ?? "bg-gray-400"}`} />
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="text-white">
                      <h3 className="text-base font-bold drop-shadow-lg truncate">{v.make} {v.model}</h3>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs opacity-90">{formatMileage(v.mileage)}</p>
                        <span className="text-xs font-medium opacity-80 flex items-center gap-0.5">
                          Tocar para registrar <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {(!vehicles || vehicles.length === 0) && (
              <div className="text-center py-12 animate-fade-up">
                <div className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-muted mb-3">
                  <span className="text-3xl">🚗</span>
                </div>
                <p className="text-sm text-muted-foreground">No tienes vehículos. Agrega uno primero.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function pickType(type: string) {
    // Si elige Combustible, ir al formulario de combustible (litros, precio/L, etc.)
    // en lugar de crear un mantenimiento de tipo FUEL
    if (type === "FUEL") {
      selectVehicle(vehicleId!);
      setView("add-fuel", { id: vehicleId! });
      return;
    }
    setSelectedType(type);
    setStep("details");
  }

  async function save() {
    if (!vehicleId || !selectedType) return;
    setSaving(true);
    try {
      const pCost = partsCost ? Number(partsCost) : 0;
      const lCost = laborCost ? Number(laborCost) : 0;
      const hasTotal = totalCost !== "" && Number(totalCost) > 0;
      const total = hasTotal ? Number(totalCost) : pCost + lCost;
      await createMaintenance.mutateAsync({
        type: selectedType,
        date,
        mileage: Number(mileage),
        description: description.trim() || null,
        partsCost: pCost,
        laborCost: lCost,
        totalCost: total,
        workshop: workshop.trim() || null,
        notes: notes.trim() || null,
        photos,
        createExpense: true,
      });
      setCelebrate(true);
      toast.success("✨ ¡Mantenimiento registrado!", {
        description: "Tu vehículo está un paso más cerca del 100%",
      });
      // Esperar a que se vea el confetti antes de navegar
      setTimeout(() => setView("vehicle-detail", { id: vehicleId }), 900);
    } catch (e) {
      toast.error("No se pudo registrar");
    } finally {
      setSaving(false);
    }
  }

  const type = MAINTENANCE_TYPES.find((t) => t.value === selectedType);

  return (
    <div className="min-h-screen">
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
      <TopBar title="Registrar mantenimiento" showBack />
      <div className="px-4 py-3 space-y-4">
        {/* Vehículo seleccionado */}
        <Card className="p-3 flex items-center gap-3">
          <div className="h-10 w-14 rounded-md overflow-hidden bg-muted shrink-0">
            {vehicle.photo ? (
               
              <img src={vehicle.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-lg">🚗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{vehicle.make} {vehicle.model}</p>
            <p className="text-xs text-muted-foreground">{formatMileage(vehicle.mileage)}</p>
          </div>
          <button
            onClick={() => selectVehicle(null)}
            className="text-xs text-primary font-medium"
          >
            Cambiar
          </button>
        </Card>

        {step === "type" && (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-2">¿Qué quieres registrar?</p>

              {/* Botón destacado: carga de combustible */}
              <button
                onClick={() => pickType("FUEL")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/30 border-2 border-fuchsia-200 dark:border-fuchsia-900 tap-feedback mb-3"
              >
                <span className="grid place-items-center h-11 w-11 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/50 text-xl shrink-0">
                  ⛽
                </span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300">Cargar combustible</p>
                  <p className="text-xs text-muted-foreground">Litros, precio/L, gasolinera y consumo km/L</p>
                </div>
                <ChevronRight className="h-4 w-4 text-fuchsia-600" />
              </button>

              <p className="text-xs text-muted-foreground mb-1.5 mt-2">Mantenimientos y servicios</p>
              <div className="grid grid-cols-3 gap-2">
                {MAINTENANCE_TYPES.filter((t) => t.value !== "FUEL").map((t) => {
                  const c = colorClasses(t.color);
                  return (
                    <button
                      key={t.value}
                      onClick={() => pickType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-transparent bg-card tap-feedback",
                        "hover:border-primary/30"
                      )}
                    >
                      <span className={cn("grid place-items-center h-10 w-10 rounded-xl text-xl", c.bgSoft)}>
                        {t.emoji}
                      </span>
                      <span className="text-[11px] font-medium text-center leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" className="w-full h-11" onClick={() => pickType("OTHER")}>
              Mantenimiento personalizado
            </Button>
          </>
        )}

        {step === "details" && type && (
          <>
            {/* Tipo seleccionado */}
            <Card className="p-3 flex items-center gap-3">
              <span className={cn("grid place-items-center h-12 w-12 rounded-xl text-2xl", colorClasses(type.color).bgSoft)}>
                {type.emoji}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{type.label}</p>
                <button onClick={() => setStep("type")} className="text-xs text-primary">Cambiar tipo</button>
              </div>
            </Card>

            {/* Campos rápidos */}
            <Card className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Kilometraje del servicio</Label>
                <div className="flex items-baseline gap-2 mt-1">
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="h-11 text-lg font-semibold"
                    inputMode="numeric"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
                {vehicle && mileage > vehicle.mileage && (
                  <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                    ↑ Actualizará el kilometraje del vehículo de {formatMileage(vehicle.mileage)} a {formatMileage(mileage)}
                  </p>
                )}
                {vehicle && mileage < vehicle.mileage && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Servicio histórico (no actualiza el kilometraje actual del vehículo: {formatMileage(vehicle.mileage)})
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Fecha</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Costo total (opcional)</Label>
                <div className="flex items-baseline gap-2 mt-1">
                  <Input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="h-11 text-lg font-semibold"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <span className="text-sm text-muted-foreground">MXN</span>
                </div>
              </div>
            </Card>

            {/* Agregar más información */}
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground px-1"
            >
              <span>Agregar más información</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
            </button>

            {showAdvanced && (
              <Card className="p-4 space-y-3 animate-fade-up">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Costo refacciones</Label>
                    <Input type="number" value={partsCost} onChange={(e) => setPartsCost(e.target.value)} className="h-11 mt-1" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Mano de obra</Label>
                    <Input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="h-11 mt-1" placeholder="0" />
                  </div>
                </div>
                {(partsCost || laborCost) && (
                  <p className="text-xs text-muted-foreground text-right">
                    Total calculado: <span className="font-semibold text-foreground">{formatCurrency(Number(partsCost || 0) + Number(laborCost || 0))}</span>
                  </p>
                )}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Descripción</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-11 mt-1" placeholder="Qué se hizo..." />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Taller / Proveedor</Label>
                  <Input value={workshop} onChange={(e) => setWorkshop(e.target.value)} className="h-11 mt-1" placeholder="Nombre del taller" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Notas</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas adicionales..." className="mt-1" />
                </div>
                <PhotoUpload value={photos} onChange={setPhotos} label="Foto / Factura" accept="image/*" />
              </Card>
            )}

            <div className="flex gap-2 pt-2 sticky bottom-4">
              <Button
                className="flex-1 h-12 text-base glow-primary shine-on-hover"
                disabled={saving}
                onClick={save}
              >
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                Guardar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
