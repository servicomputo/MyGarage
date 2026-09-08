"use client";

import { useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isCapacitor } from "@/lib/offline-db";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  accept?: string;
}

// Convierte un archivo a base64 data URL (para uso offline en el APK)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ value, onChange, label = "Foto", className, accept = "image/*" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (isCapacitor()) {
        // En el APK (sin servidor): convertir a base64 y guardar localmente
        const base64 = await fileToBase64(file);
        onChange(base64);
        toast.success("Imagen guardada");
      } else {
        // En el navegador (con servidor): subir al API
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Error ${res.status}`);
        }
        onChange(data.url);
        toast.success("Imagen subida");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[upload]", msg);
      toast.error(`No se pudo subir: ${msg}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        id={`upload-${label.replace(/\s/g, "-")}`}
      />
      <label
        htmlFor={`upload-${label.replace(/\s/g, "-")}`}
        className={cn(
          "relative block aspect-video w-full rounded-xl border-2 border-dashed border-border bg-muted/40 overflow-hidden cursor-pointer tap-feedback",
          "flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
        )}
      >
        {value ? (
          <>
            <img key={value} src={value} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Cambiar</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/40 grid place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </>
        ) : (
          <>
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-7 w-7" />
            )}
            <span className="text-xs font-medium">{uploading ? "Subiendo..." : label}</span>
          </>
        )}
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" /> Quitar
        </button>
      )}
    </div>
  );
}
