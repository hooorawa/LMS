"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StudentMetric = {
  label: string;
  value: ReactNode;
  detail: string;
  tone?: "primary" | "success" | "warning" | "info";
};

const toneClasses: Record<NonNullable<StudentMetric["tone"]>, string> = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  info: "bg-info-subtle text-info",
};

export function StudentWorkspaceHeader({
  eyebrow = "Student workspace",
  title,
  description,
  actions,
  metrics = [],
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  metrics?: StudentMetric[];
}) {
  return (
    <section className="surface-subtle shadow-panel overflow-hidden rounded-[28px] border border-border/70 p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_.95fr] lg:items-end">
        <div>
          <p className="text-eyebrow text-primary">{eyebrow}</p>
          <h1 className="text-heading mt-2 text-3xl sm:text-[2.1rem]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          {actions ? <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        {metrics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {metrics.map((metric) => (
              <Card key={metric.label} size="sm" className="bg-card/75">
                <CardContent className="flex items-center gap-3 pt-(--card-spacing)">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${toneClasses[metric.tone ?? "primary"]}`}>
                    {metric.value}
                  </div>
                  <div className="min-w-0">
                    <p className="text-eyebrow">{metric.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{metric.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
