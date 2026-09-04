"use client";

import { useState, useEffect } from "react";
import {
  useVehicle,
  useCreatePart,
  useCreateExpense,
  useCreateFuel,
  useCreateReminder,
  useCreateDocument,
} from "@/lib/queries";
import { useNav } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/photo-upload";
import {
  PART_CATEGORIES, EXPENSE_CATEGORIES, FUEL_TYPES, REMINDER_TYPES, DOCUMENT_TYPES, colorClasses,
} from "@/lib/constants";
import { Loader2, Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatMileage } from "@/lib/format";

type Kind = "add-part" | "add-expense" | "add-fuel" | "add-reminder" | "add-document";

const TITLES: Record<Kind, string> = {
  "add-part": "Nueva refacción",
  "add-expense": "Nuevo gasto",
  "add-fuel": "Carga de combustible",
  "add-reminder": "Nuevo recordatorio",
  "add-document": "Nuevo documento",
};

export function FormView({ kind }: { kind: Kind }) {
  const { params, setView } = useNav();
  const vehicleId = params.id;
  const { data: vehicle } = useVehicle(vehicleId);

  if (!vehicleId || !vehicle) {
    return (
      <div className="min-h-screen">
        <TopBar title={TITLES[kind]} showBack />
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title={TITLES[kind]} showBack subtitle={`${vehicle.make} ${vehicle.model} · ${formatMileage(vehicle.mileage)}`} />
      <div className="px-4 py-3">
        {kind === "add-part" && <PartForm vehicleId={vehicleId} mileage={vehicle.mileage} onDone={() => setView("vehicle-detail", { id: vehicleId })} />}
        {kind === "add-expense" && <ExpenseForm vehicleId={vehicleId} onDone={() => setView("vehicle-detail", { id: vehicleId })} />}
        {kind === "add-fuel" && <FuelForm vehicleId={vehicleId} mileage={vehicle.mileage} onDone={() => setView("vehicle-detail", { id: vehicleId })} />}
        {kind === "add-reminder" && <ReminderForm vehicleId={vehicleId} mileage={vehicle.mileage} onDone={() => setView("vehicle-detail", { id: vehicleId })} />}
        {kind === "add-document" && <DocumentForm vehicleId={vehicleId} onDone={() => setView("vehicle-detail", { id: vehicleId })} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ChipSelector({ options, value, onChange }: { options: { value: string; label: string; emoji: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-xs font-medium border tap-feedback",
            value === o.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          <span className="mr-1">{o.emoji}</span>{o.label}
        </button>
      ))}
    </div>
  );
}

// === Part Form ===
function PartForm({ vehicleId, mileage, onDone }: { vehicleId: string; mileage: number; onDone: () => void }) {
  const create = useCreatePart(vehicleId);
  const [form, setForm] = useState({
    name: "", category: "FILTER", brand: "", partNumber: "",
    installMileage: mileage, cost: "" as string | number, provider: "",
    estimatedLifeKm: "" as string | number, notes: "", photo: null as string | null,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim() || null,
        partNumber: form.partNumber.trim() || null,
        installMileage: Number(form.installMileage) || mileage,
        cost: form.cost === "" ? 0 : Number(form.cost),
        provider: form.provider.trim() || null,
        estimatedLifeKm: form.estimatedLifeKm === "" ? null : Number(form.estimatedLifeKm),
        notes: form.notes.trim() || null,
        photo: form.photo,
      });
      toast.success("Refacción agregada");
      onDone();
    } catch { toast.error("No se pudo guardar"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Card className="p-4 space-y-3">
        <Field label="Nombre *">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-11" placeholder="Filtro de aceite" required />
        </Field>
        <Field label="Categoría">
          <ChipSelector options={PART_CATEGORIES} value={form.category} onChange={(v) => set("category", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca">
            <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="h-11" placeholder="Bosch" />
          </Field>
          <Field label="No. de parte">
            <Input value={form.partNumber} onChange={(e) => set("partNumber", e.target.value)} className="h-11" placeholder="XYZ123" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Km de instalación">
            <Input type="number" value={form.installMileage} onChange={(e) => set("installMileage", Number(e.target.value))} className="h-11" />
          </Field>
          <Field label="Costo (MXN)">
            <Input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="0" />
          </Field>
        </div>
        <Field label="Vida útil estimada (km)">
          <Input type="number" value={form.estimatedLifeKm} onChange={(e) => set("estimatedLifeKm", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="5000" />
        </Field>
        <Field label="Proveedor">
          <Input value={form.provider} onChange={(e) => set("provider", e.target.value)} className="h-11" placeholder="AutoZone" />
        </Field>
        <Field label="Notas">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </Field>
        <PhotoUpload value={form.photo} onChange={(v) => set("photo", v)} label="Foto" />
      </Card>
      <SubmitButton loading={create.isPending} />
    </form>
  );
}

// === Expense Form ===
function ExpenseForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const create = useCreateExpense(vehicleId);
  const [form, setForm] = useState({
    title: "", category: "MAINTENANCE", amount: "" as string | number,
    date: new Date().toISOString().split("T")[0], notes: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Título requerido"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Monto requerido"); return; }
    try {
      await create.mutateAsync({
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes.trim() || null,
      });
      toast.success("Gasto registrado");
      onDone();
    } catch { toast.error("No se pudo guardar"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Card className="p-4 space-y-3">
        <Field label="Concepto *">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-11" placeholder="Lavado y encerado" required />
        </Field>
        <Field label="Categoría">
          <ChipSelector options={EXPENSE_CATEGORIES} value={form.category} onChange={(v) => set("category", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto (MXN) *">
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="0.00" required />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-11" />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </Field>
      </Card>
      <SubmitButton loading={create.isPending} />
    </form>
  );
}

// === Fuel Form ===
function FuelForm({ vehicleId, mileage, onDone }: { vehicleId: string; mileage: number; onDone: () => void }) {
  const create = useCreateFuel(vehicleId);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    mileage: mileage,
    liters: "" as string | number,
    pricePerL: "" as string | number,
    total: "" as string | number,
    fuelType: "REGULAR",
    station: "",
    fullTank: true,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Total derivado: si no se edita manualmente, se calcula de liters * pricePerL
  const computedTotal = (form.liters !== "" && form.pricePerL !== "")
    ? (Number(form.liters) * Number(form.pricePerL)).toFixed(2)
    : "";
  const displayTotal = form.total === "" ? computedTotal : form.total;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.liters || !form.pricePerL) { toast.error("Litros y precio requeridos"); return; }
    const total = form.total === "" ? Number(form.liters) * Number(form.pricePerL) : Number(form.total);
    try {
      await create.mutateAsync({
        date: form.date,
        mileage: Number(form.mileage),
        liters: Number(form.liters),
        pricePerL: Number(form.pricePerL),
        total,
        fuelType: form.fuelType,
        station: form.station.trim() || null,
        fullTank: form.fullTank,
      });
      toast.success("Carga registrada");
      onDone();
    } catch { toast.error("No se pudo guardar"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Card className="p-4 space-y-3">
        <Field label="Tipo de combustible">
          <ChipSelector options={FUEL_TYPES} value={form.fuelType} onChange={(v) => set("fuelType", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kilometraje">
            <Input type="number" value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} className="h-11" />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-11" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Litros *">
            <Input type="number" step="0.01" value={form.liters} onChange={(e) => set("liters", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="0.0" required />
          </Field>
          <Field label="Precio / L (MXN) *">
            <Input type="number" step="0.01" value={form.pricePerL} onChange={(e) => set("pricePerL", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="0.00" required />
          </Field>
        </div>
        <Field label="Total (MXN)">
          <Input
            type="number"
            step="0.01"
            value={displayTotal}
            onChange={(e) => set("total", e.target.value === "" ? "" : Number(e.target.value))}
            className="h-11 font-semibold"
            placeholder="Auto-calculado"
          />
        </Field>
        <Field label="Gasolinera">
          <Input value={form.station} onChange={(e) => set("station", e.target.value)} className="h-11" placeholder="PEMEX, Shell, etc." />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.fullTank} onChange={(e) => set("fullTank", e.target.checked)} className="h-4 w-4 rounded accent-primary" />
          Tanque lleno
        </label>
      </Card>
      <SubmitButton loading={create.isPending} />
    </form>
  );
}

// === Reminder Form ===
function ReminderForm({ vehicleId, mileage, onDone }: { vehicleId: string; mileage: number; onDone: () => void }) {
  const create = useCreateReminder(vehicleId);
  const [form, setForm] = useState({
    type: "OIL_CHANGE",
    title: "Cambio de aceite",
    intervalKm: "" as string | number,
    intervalDays: "" as string | number,
    enabled: true,
    notes: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function onTypeChange(v: string) {
    const t = REMINDER_TYPES.find((r) => r.value === v);
    setForm((f) => ({ ...f, type: v, title: t?.label ?? f.title }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.intervalKm && !form.intervalDays) { toast.error("Indica intervalo en km o días"); return; }
    try {
      await create.mutateAsync({
        type: form.type,
        title: form.title.trim(),
        intervalKm: form.intervalKm === "" ? null : Number(form.intervalKm),
        intervalDays: form.intervalDays === "" ? null : Number(form.intervalDays),
        lastDoneKm: mileage,
        lastDoneDate: new Date(),
        enabled: form.enabled,
        notes: form.notes.trim() || null,
      });
      toast.success("Recordatorio creado");
      onDone();
    } catch { toast.error("No se pudo guardar"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Card className="p-4 space-y-3">
        <Field label="Tipo de recordatorio">
          <ChipSelector options={REMINDER_TYPES} value={form.type} onChange={onTypeChange} />
        </Field>
        <Field label="Título">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-11" />
        </Field>
        <p className="text-xs text-muted-foreground">Repetir cada:</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kilómetros">
            <Input type="number" value={form.intervalKm} onChange={(e) => set("intervalKm", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="5000" />
          </Field>
          <Field label="Días (ej. 180)">
            <Input type="number" value={form.intervalDays} onChange={(e) => set("intervalDays", e.target.value === "" ? "" : Number(e.target.value))} className="h-11" placeholder="180" />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">Si indicas ambos, se recordará el que ocurra primero.</p>
        <Field label="Notas">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 rounded accent-primary" />
          Activar recordatorio
        </label>
      </Card>
      <SubmitButton loading={create.isPending} />
    </form>
  );
}

// === Document Form ===
function DocumentForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const create = useCreateDocument(vehicleId);
  const [form, setForm] = useState({
    type: "INVOICE",
    title: "",
    fileUrl: null as string | null,
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Título requerido"); return; }
    if (!form.fileUrl) { toast.error("Sube un archivo"); return; }
    try {
      await create.mutateAsync({
        type: form.type,
        title: form.title.trim(),
        fileUrl: form.fileUrl,
        fileType: form.fileUrl.match(/\.(pdf)$/i) ? "pdf" : "image",
        notes: form.notes.trim() || null,
        date: form.date,
      });
      toast.success("Documento guardado");
      onDone();
    } catch { toast.error("No se pudo guardar"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Card className="p-4 space-y-3">
        <Field label="Tipo de documento">
          <ChipSelector options={DOCUMENT_TYPES} value={form.type} onChange={(v) => set("type", v)} />
        </Field>
        <Field label="Título *">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-11" placeholder="Factura de servicio" required />
        </Field>
        <PhotoUpload value={form.fileUrl} onChange={(v) => set("fileUrl", v)} label="Archivo (imagen o PDF)" accept="image/*,application/pdf" />
        <Field label="Fecha">
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-11" />
        </Field>
        <Field label="Notas">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </Field>
      </Card>
      <SubmitButton loading={create.isPending} />
    </form>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
      Guardar
    </Button>
  );
}
