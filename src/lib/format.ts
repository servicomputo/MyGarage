// Helpers de formato y cálculo

export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
}

export function formatMileage(km: number | null | undefined): string {
  return `${formatNumber(km)} km`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const isFuture = diffMs < 0;
  const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  if (absDays === 0) return "Hoy";
  if (!isFuture) {
    if (absDays === 1) return "Ayer";
    if (absDays < 7) return `Hace ${absDays} días`;
    if (absDays < 30) return `Hace ${Math.floor(absDays / 7)} sem`;
    if (absDays < 365) return `Hace ${Math.floor(absDays / 30)} meses`;
    return `Hace ${Math.floor(absDays / 365)} años`;
  } else {
    if (absDays === 1) return "Mañana";
    if (absDays < 7) return `En ${absDays} días`;
    if (absDays < 30) return `En ${Math.floor(absDays / 7)} sem`;
    if (absDays < 365) return `En ${Math.floor(absDays / 30)} meses`;
    return `En ${Math.floor(absDays / 365)} años`;
  }
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Estado de un recordatorio: verde/amarillo/rojo
export type ReminderStatus = "ok" | "soon" | "overdue" | "none";

export function getReminderStatus(
  reminder: { nextDueKm?: number | null; nextDueDate?: Date | string | null; enabled?: boolean },
  currentMileage: number
): { status: ReminderStatus; label: string; subLabel?: string } {
  if (reminder.enabled === false) {
    return { status: "none", label: "Inactivo" };
  }
  const now = new Date();
  const dueDate = reminder.nextDueDate ? new Date(reminder.nextDueDate) : null;
  const dueKm = reminder.nextDueKm ?? null;

  // Si ambos
  if (dueKm && dueDate) {
    const kmLeft = dueKm - currentMileage;
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    // lo que ocurra primero
    if (kmLeft <= 0 || daysLeft <= 0) {
      return { status: "overdue", label: "Vencido", subLabel: kmLeft <= 0 ? "Por kilometraje" : "Por fecha" };
    }
    if (kmLeft <= 500 || daysLeft <= 15) {
      return { status: "soon", label: kmLeft <= 500 ? `Faltan ${kmLeft} km` : `Vence en ${daysLeft} días` };
    }
    return { status: "ok", label: kmLeft <= daysLeft * 30 ? `Faltan ${kmLeft} km` : `Vence en ${daysLeft} días` };
  }
  // Solo por km
  if (dueKm) {
    const kmLeft = dueKm - currentMileage;
    if (kmLeft <= 0) return { status: "overdue", label: "Vencido" };
    if (kmLeft <= 500) return { status: "soon", label: `Faltan ${kmLeft} km` };
    return { status: "ok", label: `Faltan ${formatNumber(kmLeft)} km` };
  }
  // Solo por fecha
  if (dueDate) {
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { status: "overdue", label: "Vencido" };
    if (daysLeft <= 15) return { status: "soon", label: `Vence en ${daysLeft} días` };
    return { status: "ok", label: `Vence en ${daysLeft} días` };
  }
  return { status: "none", label: "Sin programar" };
}

export const STATUS_COLOR: Record<ReminderStatus, { dot: string; text: string; bg: string; ring: string }> = {
  ok: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", ring: "ring-emerald-200 dark:ring-emerald-900" },
  soon: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", ring: "ring-amber-200 dark:ring-amber-900" },
  overdue: { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/40", ring: "ring-rose-200 dark:ring-rose-900" },
  none: { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/40", ring: "ring-gray-200 dark:ring-gray-700" },
};

// Calcular estado general del vehículo basado en recordatorios
export function getVehicleStatus(
  reminders: { nextDueKm?: number | null; nextDueDate?: Date | string | null; enabled?: boolean }[],
  currentMileage: number
): { status: ReminderStatus; label: string } {
  if (reminders.length === 0) {
    return { status: "ok", label: "Sin recordatorios" };
  }
  let hasOverdue = false;
  let hasSoon = false;
  for (const r of reminders) {
    const s = getReminderStatus(r, currentMileage);
    if (s.status === "overdue") hasOverdue = true;
    else if (s.status === "soon") hasSoon = true;
  }
  if (hasOverdue) return { status: "overdue", label: "Atención requerida" };
  if (hasSoon) return { status: "soon", label: "Próximo mantenimiento" };
  return { status: "ok", label: "Todo en orden" };
}

// Calcula fecha siguiente dado un intervalo en días
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}
