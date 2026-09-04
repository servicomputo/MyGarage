"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_COLOR, type ReminderStatus } from "@/lib/format";
import { getMaintenanceType, colorClasses } from "@/lib/constants";

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="mb-3 grid place-items-center h-16 w-16 rounded-2xl bg-muted">
        {emoji ? <span className="text-3xl">{emoji}</span> : icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface StatusBadgeProps {
  status: ReminderStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const validStatuses = ["ok", "soon", "overdue", "none"];
  const safeStatus = validStatuses.includes(status as string) ? (status as ReminderStatus) : "none" as ReminderStatus;
  const c = STATUS_COLOR[safeStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {label}
    </span>
  );
}

interface ServiceIconProps {
  type: string;
  customType?: string | null;
  size?: "sm" | "md" | "lg";
}

export function ServiceIcon({ type, customType, size = "md" }: ServiceIconProps) {
  const t = getMaintenanceType(type);
  const c = colorClasses(t.color);
  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-lg",
    lg: "h-12 w-12 text-2xl",
  };
  return (
    <span
      className={cn(
        "grid place-items-center rounded-xl shrink-0",
        sizes[size],
        c.bgSoft,
        c.text
      )}
      aria-hidden
    >
      <span>{t.emoji}</span>
    </span>
  );
}

interface SectionCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({ title, action, children, className, bodyClassName }: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn("px-4 pb-4", bodyClassName)}>{children}</div>
    </Card>
  );
}

interface StatPillProps {
  label: string;
  value: string;
  accent?: string;
}

export function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-base font-semibold mt-0.5", accent)}>{value}</p>
    </div>
  );
}

interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ icon, title, subtitle, right, onClick, className }: ListRowProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 py-3 text-left tap-feedback",
        onClick && "hover:bg-muted/40 -mx-2 px-2 rounded-lg",
        className
      )}
    >
      {icon}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right}
    </Comp>
  );
}
