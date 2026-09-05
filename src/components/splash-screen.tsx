"use client";

import { Car, Wrench, Gauge } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Gradiente de fondo animado */}
      <div
        className="absolute inset-0 animate-gradient opacity-60"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.62 0.15 162 / 0.08) 0%, oklch(0.7 0.17 60 / 0.06) 50%, oklch(0.65 0.2 300 / 0.06) 100%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Ondas concéntricas detrás del logo — muy visibles */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="h-32 w-32 rounded-full border-[3px] border-primary/40 animate-ripple" />
        <div className="h-32 w-32 rounded-full border-[3px] border-primary/30 animate-ripple absolute" style={{ animationDelay: "0.4s" }} />
        <div className="h-32 w-32 rounded-full border-[3px] border-primary/25 animate-ripple absolute" style={{ animationDelay: "0.8s" }} />
        <div className="h-32 w-32 rounded-full border-[3px] border-primary/20 animate-ripple absolute" style={{ animationDelay: "1.2s" }} />
      </div>

      {/* Contenido principal */}
      <div className="relative flex flex-col items-center gap-5 z-10">
        {/* Logo con entrada épica */}
        <div className="relative">
          {/* Sombra/glow detrás */}
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-3xl scale-150" />
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 grid place-items-center shadow-2xl shadow-primary/40 animate-logo">
            <Car className="h-12 w-12 text-white animate-float" strokeWidth={2.2} />
          </div>

          {/* Iconos decorativos flotando */}
          <div className="absolute -top-3 -right-6 h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 grid place-items-center shadow-lg animate-float" style={{ animationDelay: "0.5s" }}>
            <Wrench className="h-4 w-4 text-amber-600" />
          </div>
          <div className="absolute -bottom-2 -left-6 h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-950/50 grid place-items-center shadow-lg animate-float" style={{ animationDelay: "1s" }}>
            <Gauge className="h-4 w-4 text-sky-600" />
          </div>
        </div>

        {/* Nombre de la app */}
        <div className="text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">My Garage</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu vehículo, siempre al 100%</p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-2 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <span className="h-2 w-2 rounded-full bg-primary dot-1" />
          <span className="h-2 w-2 rounded-full bg-primary dot-2" />
          <span className="h-2 w-2 rounded-full bg-primary dot-3" />
        </div>
      </div>

      {/* Frase inferior */}
      <p className="absolute bottom-8 text-xs text-muted-foreground/70 animate-fade-in" style={{ animationDelay: "1s" }}>
        Cargando tu garage...
      </p>
    </div>
  );
}
