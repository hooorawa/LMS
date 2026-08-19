"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Panel } from "./panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const SLOT_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-6)",
  "var(--color-chart-4)",
  "var(--color-chart-7)",
];

export type MultiSeriesPoint = Record<string, string | number> & { label: string };

export type MultiSeriesDef = {
  key: string;
  label: string;
};

export function MultiSeriesChart({
  title,
  sub,
  data,
  series,
  variant = "line",
  format = "number",
  action,
  emptyLabel = "No data yet.",
  className,
}: {
  title: string;
  sub: string;
  data: MultiSeriesPoint[];
  series: MultiSeriesDef[];
  variant?: "line" | "bar";
  format?: "number" | "currency";
  action?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
}) {
  const hasData = data.some((point) => series.some((s) => Number(point[s.key]) > 0));

  const chartConfig = series.reduce((config, s, index) => {
    config[s.key] = { label: s.label, color: SLOT_VARS[index % SLOT_VARS.length] };
    return config;
  }, {} as ChartConfig);

  const formatValue = (value: number) => (format === "currency" ? `$${value.toFixed(2)}` : value.toLocaleString());

  return (
    <Panel title={title} sub={sub} className={cn("flex-1 p-5", className)} action={action}>
      {!hasData ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-[220px] w-full"
          initialDimension={{ width: 560, height: 220 }}
        >
          {variant === "line" ? (
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11.5, fill: "var(--color-chart-axis)" }}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--color-chart-axis)", strokeDasharray: 3 }}
                content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  type="monotone"
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={2}
                  dot={{ r: 4, fill: `var(--color-${s.key})`, strokeWidth: 2, stroke: "var(--color-card)" }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11.5, fill: "var(--color-chart-axis)" }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  fill={`var(--color-${s.key})`}
                  radius={[4, 4, 2, 2]}
                  maxBarSize={20}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          )}
        </ChartContainer>
      )}
    </Panel>
  );
}
