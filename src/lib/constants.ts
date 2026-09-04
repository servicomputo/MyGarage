// Constantes del dominio - tipos, etiquetas, emojis e iconos

export interface ServiceTypeOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

// Tipos de mantenimiento con emojis y colores (no usar azul/índigo)
export const MAINTENANCE_TYPES: ServiceTypeOption[] = [
  { value: "OIL_CHANGE", label: "Cambio de aceite", emoji: "🛢️", color: "amber" },
  { value: "GENERAL_SERVICE", label: "Servicio general", emoji: "🔧", color: "emerald" },
  { value: "TIRES", label: "Llantas", emoji: "🛞", color: "slate" },
  { value: "BRAKES", label: "Frenos", emoji: "🛑", color: "rose" },
  { value: "BATTERY", label: "Batería", emoji: "🔋", color: "lime" },
  { value: "COOLANT", label: "Refrigerante", emoji: "🌡️", color: "cyan" },
  { value: "TRANSMISSION", label: "Transmisión", emoji: "⚙️", color: "orange" },
  { value: "AC", label: "Aire acondicionado", emoji: "❄️", color: "sky" },
  { value: "ELECTRICAL", label: "Sistema eléctrico", emoji: "🔌", color: "yellow" },
  { value: "REPAIR", label: "Reparación", emoji: "🧰", color: "red" },
  { value: "FUEL", label: "Combustible", emoji: "⛽", color: "fuchsia" },
  { value: "VERIFICATION", label: "Verificación", emoji: "📋", color: "teal" },
  { value: "INSURANCE", label: "Seguro", emoji: "🛡️", color: "violet" },
  { value: "TAX", label: "Tenencia", emoji: "📄", color: "purple" },
  { value: "OTHER", label: "Otro", emoji: "🚗", color: "gray" },
];

export const MAINTENANCE_MAP: Record<string, ServiceTypeOption> = Object.fromEntries(
  MAINTENANCE_TYPES.map((m) => [m.value, m])
);

export function getMaintenanceType(value?: string | null): ServiceTypeOption {
  if (value && MAINTENANCE_MAP[value]) return MAINTENANCE_MAP[value];
  return MAINTENANCE_MAP.OTHER;
}

// Categorías de refacciones
export const PART_CATEGORIES: ServiceTypeOption[] = [
  { value: "FILTER", label: "Filtro", emoji: "🔄", color: "emerald" },
  { value: "BRAKE", label: "Frenos", emoji: "🛑", color: "rose" },
  { value: "TIRE", label: "Llanta", emoji: "🛞", color: "slate" },
  { value: "BATTERY", label: "Batería", emoji: "🔋", color: "lime" },
  { value: "ENGINE", label: "Motor", emoji: "⚙️", color: "orange" },
  { value: "TRANSMISSION", label: "Transmisión", emoji: "🔩", color: "amber" },
  { value: "ELECTRICAL", label: "Eléctrico", emoji: "🔌", color: "yellow" },
  { value: "COOLING", label: "Refrigeración", emoji: "🌡️", color: "cyan" },
  { value: "SUSPENSION", label: "Suspensión", emoji: "🪛", color: "fuchsia" },
  { value: "EXHAUST", label: "Escape", emoji: "💨", color: "gray" },
  { value: "BODY", label: "Carrocería", emoji: "🚗", color: "teal" },
  { value: "OTHER", label: "Otra", emoji: "📦", color: "purple" },
];

export const PART_MAP: Record<string, ServiceTypeOption> = Object.fromEntries(
  PART_CATEGORIES.map((p) => [p.value, p])
);

export function getPartCategory(value?: string | null): ServiceTypeOption {
  if (value && PART_MAP[value]) return PART_MAP[value];
  return PART_MAP.OTHER;
}

// Categorías de gastos
export const EXPENSE_CATEGORIES: ServiceTypeOption[] = [
  { value: "MAINTENANCE", label: "Mantenimiento", emoji: "🔧", color: "emerald" },
  { value: "PARTS", label: "Refacciones", emoji: "🧰", color: "amber" },
  { value: "FUEL", label: "Combustible", emoji: "⛽", color: "fuchsia" },
  { value: "INSURANCE", label: "Seguro", emoji: "🛡️", color: "violet" },
  { value: "TAXES", label: "Impuestos", emoji: "📄", color: "purple" },
  { value: "VERIFICATION", label: "Verificación", emoji: "📋", color: "teal" },
  { value: "TIRES", label: "Llantas", emoji: "🛞", color: "slate" },
  { value: "REPAIRS", label: "Reparaciones", emoji: "🧰", color: "red" },
  { value: "WASH", label: "Lavado", emoji: "🧽", color: "sky" },
  { value: "OTHER", label: "Otro", emoji: "💸", color: "gray" },
];

export const EXPENSE_MAP: Record<string, ServiceTypeOption> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((e) => [e.value, e])
);

export function getExpenseCategory(value?: string | null): ServiceTypeOption {
  if (value && EXPENSE_MAP[value]) return EXPENSE_MAP[value];
  return EXPENSE_MAP.OTHER;
}

// Tipos de combustible
export const FUEL_TYPES: ServiceTypeOption[] = [
  { value: "REGULAR", label: "Regular", emoji: "⛽", color: "emerald" },
  { value: "PREMIUM", label: "Premium", emoji: "⛽", color: "amber" },
  { value: "DIESEL", label: "Diésel", emoji: "⛽", color: "slate" },
  { value: "OTHER", label: "Otro", emoji: "⛽", color: "gray" },
];

// Tipos de recordatorios
export const REMINDER_TYPES: ServiceTypeOption[] = [
  { value: "OIL_CHANGE", label: "Cambio de aceite", emoji: "🛢️", color: "amber" },
  { value: "FILTERS", label: "Filtros", emoji: "🔄", color: "emerald" },
  { value: "BRAKES", label: "Frenos", emoji: "🛑", color: "rose" },
  { value: "TIRES", label: "Llantas", emoji: "🛞", color: "slate" },
  { value: "BATTERY", label: "Batería", emoji: "🔋", color: "lime" },
  { value: "TUNE_UP", label: "Afinación", emoji: "🔧", color: "orange" },
  { value: "TRANSMISSION", label: "Transmisión", emoji: "⚙️", color: "amber" },
  { value: "COOLANT", label: "Anticongelante", emoji: "🌡️", color: "cyan" },
  { value: "VERIFICATION", label: "Verificación", emoji: "📋", color: "teal" },
  { value: "INSURANCE", label: "Seguro", emoji: "🛡️", color: "violet" },
  { value: "TAX", label: "Tenencia", emoji: "📄", color: "purple" },
  { value: "OTHER", label: "Otro", emoji: "📌", color: "gray" },
];

export const REMINDER_MAP: Record<string, ServiceTypeOption> = Object.fromEntries(
  REMINDER_TYPES.map((r) => [r.value, r])
);

export function getReminderType(value?: string | null): ServiceTypeOption {
  if (value && REMINDER_MAP[value]) return REMINDER_MAP[value];
  return REMINDER_MAP.OTHER;
}

// Tipos de documentos
export const DOCUMENT_TYPES: ServiceTypeOption[] = [
  { value: "INVOICE", label: "Factura", emoji: "🧾", color: "emerald" },
  { value: "INSURANCE", label: "Póliza de seguro", emoji: "🛡️", color: "violet" },
  { value: "REGISTRATION", label: "Tarjeta de circulación", emoji: "💳", color: "amber" },
  { value: "VERIFICATION", label: "Verificación", emoji: "📋", color: "teal" },
  { value: "REPAIR_INVOICE", label: "Factura de reparación", emoji: "🧰", color: "rose" },
  { value: "MANUAL", label: "Manual", emoji: "📘", color: "sky" },
  { value: "WARRANTY", label: "Garantía", emoji: "✅", color: "lime" },
  { value: "OTHER", label: "Otro", emoji: "📎", color: "gray" },
];

export const DOCUMENT_MAP: Record<string, ServiceTypeOption> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d])
);

export function getDocumentType(value?: string | null): ServiceTypeOption {
  if (value && DOCUMENT_MAP[value]) return DOCUMENT_MAP[value];
  return DOCUMENT_MAP.OTHER;
}

// Mapa de colores -> clases Tailwind (sin azul/índigo para evitar conflictos con la marca)
export const COLOR_CLASSES: Record<string, {
  bg: string;
  bgSoft: string;
  text: string;
  border: string;
  dot: string;
}> = {
  amber: { bg: "bg-amber-500", bgSoft: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  emerald: { bg: "bg-emerald-500", bgSoft: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-900", dot: "bg-emerald-500" },
  slate: { bg: "bg-slate-500", bgSoft: "bg-slate-100 dark:bg-slate-800/60", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", dot: "bg-slate-500" },
  rose: { bg: "bg-rose-500", bgSoft: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  lime: { bg: "bg-lime-500", bgSoft: "bg-lime-100 dark:bg-lime-950/40", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-900", dot: "bg-lime-500" },
  cyan: { bg: "bg-cyan-500", bgSoft: "bg-cyan-100 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-900", dot: "bg-cyan-500" },
  orange: { bg: "bg-orange-500", bgSoft: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-900", dot: "bg-orange-500" },
  sky: { bg: "bg-sky-500", bgSoft: "bg-sky-100 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-900", dot: "bg-sky-500" },
  yellow: { bg: "bg-yellow-500", bgSoft: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-900", dot: "bg-yellow-500" },
  red: { bg: "bg-red-500", bgSoft: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-900", dot: "bg-red-500" },
  fuchsia: { bg: "bg-fuchsia-500", bgSoft: "bg-fuchsia-100 dark:bg-fuchsia-950/40", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-900", dot: "bg-fuchsia-500" },
  teal: { bg: "bg-teal-500", bgSoft: "bg-teal-100 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-900", dot: "bg-teal-500" },
  violet: { bg: "bg-violet-500", bgSoft: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-900", dot: "bg-violet-500" },
  purple: { bg: "bg-purple-500", bgSoft: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-900", dot: "bg-purple-500" },
  gray: { bg: "bg-gray-500", bgSoft: "bg-gray-100 dark:bg-gray-800/60", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700", dot: "bg-gray-500" },
};

export function colorClasses(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
}
