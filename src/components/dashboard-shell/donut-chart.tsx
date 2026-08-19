"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Panel } from "./panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const SLOT_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
};

export function DonutChart({
  title,
  sub,
  data,
  emptyLabel = "No data yet.",
  className,
}: {
  title: string;
  sub: string;
  data: DonutSlice[];
  emptyLabel?: string;
  className?: string;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const hasData = total > 0;

  const chartConfig = data.reduce((config, slice, index) => {
    config[slice.key] = { label: slice.label, color: SLOT_VARS[index % SLOT_VARS.length] };
    return config;
  }, {} as ChartConfig);

  return (
    <Panel title={title} sub={sub} className={cn("flex-1 p-5", className)}>
      {!hasData ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-[180px] w-[180px] shrink-0"
            initialDimension={{ width: 180, height: 180 }}
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                cornerRadius={4}
                isAnimationActive={false}
                stroke="var(--color-card)"
                strokeWidth={2}
              >
                {data.map((slice, index) => (
                  <Cell key={slice.key} fill={SLOT_VARS[index % SLOT_VARS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex w-full flex-col gap-2">
            {data.map((slice, index) => (
              <div key={slice.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: SLOT_VARS[index % SLOT_VARS.length] }}
                  />
                  <span className="capitalize">{slice.label}</span>
                </span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {slice.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
