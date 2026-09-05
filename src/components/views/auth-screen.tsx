"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User as UserIcon, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j.error || "Error al registrar");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error(result?.error || "Credenciales incorrectas");
      }
      toast.success(mode === "login" ? "Sesión iniciada" : "Cuenta creada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function tryDemo() {
    setLoading(true);
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Usuario Demo", email: "demo@garage.app", password: "demo1234" }),
      });
      const result = await signIn("credentials", {
        email: "demo@garage.app",
        password: "demo1234",
        redirect: false,
      });
      if (!result || result.error) throw new Error("No se pudo entrar al demo");
      toast.success("Sesión demo iniciada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-background safe-top">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 mb-3">
            <Car className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">My Garage</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            La bitácora inteligente de tus vehículos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-5">
          <button
            onClick={() => setMode("login")}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode("register")}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-11"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11"
                placeholder="tu@correo.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 h-11"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 text-base mt-2">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <Button onClick={tryDemo} variant="outline" className="w-full h-11" disabled={loading}>
          Probar con cuenta demo
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Al continuar aceptas mantener tus datos seguros. Cada usuario solo accede a sus propios vehículos.
        </p>
      </div>
    </div>
  );
}
