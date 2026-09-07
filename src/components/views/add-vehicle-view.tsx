"use client";

import { useEffect, useState } from "react";
import { useVehicle, useCreateVehicle, useUpdateVehicle } from "@/lib/queries";
import { useNav } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/photo-upload";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

export function AddVehicleView({ editing }: { editing?: boolean }) {
  const { params, selectVehicle, setView } = useNav();
  const vehicleId = editing ? params.id : null;
  const { data: existing } = useVehicle(vehicleId);
  const create = useCreateVehicle();
  const update = useUpdateVehicle(vehicleId ?? "");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    photo: null as string | null,
    make: "",
    model: "",
    year: CURRENT_YEAR,
    version: "",
    color: "",
    plates: "",
    vin: "",
    mileage: 0,
    purchaseDate: "",
    purchasePrice: "" as string | number,
    notes: "",
  });

  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({
        ...prev,
        photo: prev.photo ?? existing.photo ?? null,
        make: existing.make,
        model: existing.model,
        year: existing.year,
        version: existing.version ?? "",
        color: existing.color ?? "",
        plates: existing.plates ?? "",
        vin: existing.vin ?? "",
        mileage: existing.mileage,
        purchaseDate: existing.purchaseDate ? existing.purchaseDate.split("T")[0] : "",
        purchasePrice: existing.purchasePrice ?? "",
        notes: existing.notes ?? "",
      }));
    }
  }, [existing]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) {
      toast.error("Marca y modelo son obligatorios");
      return;
    }
    const payload = {
      photo: form.photo,
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      version: form.version.trim() || null,
      color: form.color.trim() || null,
      plates: form.plates.trim() || null,
      vin: form.vin.trim() || null,
      mileage: Number(form.mileage) || 0,
      purchaseDate: form.purchaseDate || null,
      purchasePrice: form.purchasePrice === "" ? null : Number(form.purchasePrice),
      notes: form.notes.trim() || null,
    };
    try {
      if (editing && vehicleId) {
        await update.mutateAsync(payload);
        toast.success("Vehículo actualizado");
        setView("vehicle-detail", { id: vehicleId });
      } else {
        const created = await create.mutateAsync(payload);
        toast.success("Vehículo agregado");
        selectVehicle(created.id);
        setView("vehicle-detail", { id: created.id });
      }
    } catch (err) {
      toast.error("No se pudo guardar el vehículo");
    }
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className="min-h-screen">
      <TopBar title={editing ? "Editar vehículo" : "Nuevo vehículo"} showBack />
      <form onSubmit={submit} className="px-4 py-3 space-y-4">
        <PhotoUpload value={form.photo} onChange={(url) => set("photo", url)} label="Foto del vehículo" />

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca *">
              <Input
                value={form.make}
                onChange={(e) => set("make", e.target.value)}
                placeholder="Toyota"
                className="h-11"
                list="makes"
                required
              />
              <datalist id="makes">
                {["Toyota", "Nissan", "Chevrolet", "Ford", "Honda", "Volkswagen", "Mazda", "Kia", "Hyundai", "Mitsubishi", "Jeep", "Ram", "Suzuki", "Renault", "Seat"].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Modelo *">
              <Input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="Sienna"
                className="h-11"
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Año *">
              <Input
                type="number"
                value={form.year}
                min={1950}
                max={CURRENT_YEAR + 1}
                onChange={(e) => set("year", Number(e.target.value))}
                className="h-11"
                required
              />
            </Field>
            <Field label="Kilometraje *">
              <Input
                type="number"
                value={form.mileage}
                min={0}
                onChange={(e) => set("mileage", Number(e.target.value))}
                className="h-11"
                required
              />
            </Field>
          </div>
        </Card>

        {/* Campos opcionales avanzados */}
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground px-1"
        >
          <span>Información adicional</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
        </button>

        {showAdvanced && (
          <Card className="p-4 space-y-3 animate-fade-up">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Versión">
                <Input value={form.version} onChange={(e) => set("version", e.target.value)} className="h-11" placeholder="XLE" />
              </Field>
              <Field label="Color">
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} className="h-11" placeholder="Gris" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Placas">
                <Input value={form.plates} onChange={(e) => set("plates", e.target.value)} className="h-11" placeholder="ABC-123" />
              </Field>
              <Field label="VIN / Serie">
                <Input value={form.vin} onChange={(e) => set("vin", e.target.value)} className="h-11" placeholder="VIN" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de compra">
                <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} className="h-11" />
              </Field>
              <Field label="Precio de compra">
                <Input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-11"
                  placeholder="$"
                />
              </Field>
            </div>
            <Field label="Notas">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Notas internas..." />
            </Field>
          </Card>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-[2] h-11" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editing ? "Guardar cambios" : "Agregar vehículo"}
          </Button>
        </div>
      </form>
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
