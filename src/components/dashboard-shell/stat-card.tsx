import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatSparkline } from "./stat-sparkline";

const TONE_ACCENT = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
} as const;

const TONE_ICON = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/14 text-success",
  warning: "bg-warning/16 text-warning",
  info: "bg-info/14 text-info",
} as const;

const TONE_COLOR_VAR = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
} as const;

export function StatCard({
  label,
  icon: Icon,
  value,
  sub,
  tone,
  trend,
}: {
  label: string;
  icon: LucideIcon;
  value: string | number;
  sub?: string;
  tone?: keyof typeof TONE_ACCENT;
  trend?: number[];
}) {
  const color = tone ? TONE_COLOR_VAR[tone] : "var(--color-primary)";

  return (
    <div className="shadow-panel relative flex flex-col gap-3.5 overflow-hidden rounded-2xl bg-card p-5 pb-4.5">
      {tone ? (
        <span className={cn("absolute inset-y-0 left-0 w-[3px]", TONE_ACCENT[tone])} />
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-eyebrow">{label}</span>
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-(--radius-icon)", TONE_ICON[tone ?? "primary"])}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-heading text-[28px]">{value}</span>
          {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
        </div>
        {trend && trend.length > 1 ? (
          <StatSparkline
            trend={trend}
            color={color}
            gradientId={`stat-sparkline-${label.replace(/\s+/g, "-")}`}
          />
        ) : null}
      </div>
    </div>
  );
}
