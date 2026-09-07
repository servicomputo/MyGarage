"use client";

import { useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  accept?: string;
}

export function PhotoUpload({ value, onChange, label = "Foto", className, accept = "image/*" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      onChange(data.url);
      toast.success("Imagen subida");
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
