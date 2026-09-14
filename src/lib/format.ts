// Helpers de fecha que respetan la zona horaria del usuario.
// Las fechas de "solo día" (sin hora) se manejan como mediodía UTC
// para evitar que un cambio de zona horaria mueva la fecha al día anterior/siguiente.

// Convierte un string "YYYY-MM-DD" (de un input date) a un Date a mediodía UTC.
// Esto evita que la fecha cambie de día al convertir entre zonas horarias.
export function parseDateInput(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  // Mediodía UTC para evitar cambios de día por zona horaria
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

// Devuelve la fecha de hoy en formato "YYYY-MM-DD" usando la zona horaria
// LOCAL del navegador (no UTC). Esto evita que a partir de cierta hora
// el día se adelante por la conversión a UTC.
export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

// Redondea un número a 2 decimales (para cálculos de combustible, costos, etc.)
export function round2(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatMileage(km: number | null | undefined): string {
  return `${formatNumber(km)} km`;
}

const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Formatea una fecha mostrando solo el día/mes/año.
// Usa UTC para que sea consistente con cómo se guardan las fechas (mediodía UTC).
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  // Extraer componentes en UTC para consistencia
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  return `${day} de ${MONTHS_LONG[month]} de ${year}`;
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  // Comparar solo por día (ignorando hora) para "Hoy" / "Ayer"
  const dayDiff = Math.floor((startOfUTCDate(now).getTime() - startOfUTCDate(d).getTime()) / (1000 * 60 * 60 * 24));
  const isFuture = dayDiff < 0;
  const absDays = Math.abs(dayDiff);
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

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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

// === Sistema de insignias de cuidado (gamificación) ===
export interface CareBadge {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export function getCareBadges(stats: {
  maintenanceCount: number;
  totalSpend: number;
  hasReminders: boolean;
  overdueCount: number;
  fuelingCount: number;
  documentsCount: number;
}): CareBadge[] {
  const badges: CareBadge[] = [];

  if (stats.maintenanceCount >= 2) {
    badges.push({ emoji: "🔧", label: "Bien mantenido", description: "2+ servicios registrados", color: "emerald" });
  }
  if (stats.hasReminders && stats.overdueCount === 0) {
    badges.push({ emoji: "✅", label: "Al día", description: "Sin mantenimientos vencidos", color: "emerald" });
  }
  if (stats.documentsCount >= 1) {
    badges.push({ emoji: "📋", label: "Documentado", description: "Expediente completo", color: "sky" });
  }
  if (stats.fuelingCount >= 2) {
    badges.push({ emoji: "⛽", label: "Monitoreado", description: "Consumo de combustible tracked", color: "fuchsia" });
  }
  if (stats.totalSpend >= 5000) {
    badges.push({ emoji: "💎", label: "Cuidado premium", description: "Inversión significativa", color: "violet" });
  }
  if (stats.maintenanceCount >= 1 && stats.maintenanceCount < 2) {
    badges.push({ emoji: "🌱", label: "En camino", description: "Primer servicio registrado", color: "emerald" });
  }

  return badges;
}

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
