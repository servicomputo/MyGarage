"use client";

import { useState } from "react";
import { Car, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setUserName } from "@/lib/user-name";
import { toast } from "sonner";

interface WelcomeScreenProps {
  onDone: () => void;
}

export function WelcomeScreen({ onDone }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Escribe tu nombre para continuar");
      return;
    }
    setLoading(true);
    setUserName(name);
    toast.success(`¡Bienvenido, ${name.trim()}!`);
    setTimeout(() => {
      onDone();
    }, 600);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-background relative overflow-hidden">
      {/* Gradiente de fondo animado */}
      <div
        className="absolute inset-0 animate-gradient opacity-50"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.62 0.15 162 / 0.1) 0%, oklch(0.7 0.17 60 / 0.08) 50%, oklch(0.65 0.2 300 / 0.08) 100%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Contenido */}
      <div className="relative flex flex-col items-center gap-6 w-full max-w-sm z-10">
        {/* Logo */}
        <div className="relative animate-logo">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-3xl scale-150" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 grid place-items-center shadow-2xl shadow-primary/40">
            <Car className="h-10 w-10 text-white animate-float" strokeWidth={2.2} />
          </div>
        </div>

        {/* Título */}
        <div className="text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">My Garage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu bitácora inteligente para el control de tus vehículos
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              ¿Cómo te llamas?
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="h-12 text-base"
              autoFocus
              maxLength={50}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base glow-primary shine-on-hover"
            disabled={loading}
          >
            {loading ? (
              "Guardando..."
            ) : (
              <>
                Empezar <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center animate-fade-in" style={{ animationDelay: "0.7s" }}>
          Tus datos se guardan localmente en este dispositivo
        </p>
      </div>
    </div>
  );
}
