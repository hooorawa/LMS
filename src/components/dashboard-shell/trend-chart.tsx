"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Panel } from "./panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type TrendPoint = {
  label: string;
  value: number;
};

const VALUE_FORMATTERS = {
  number: (value: number) => value.toLocaleString(),
  currency: (value: number) => `$${value.toFixed(2)}`,
} as const;

export function TrendChart({
  title,
  sub,
  data,
  color = "var(--color-chart-1)",
  format = "number",
  action,
  emptyLabel = "No data yet.",
}: {
  title: string;
  sub: string;
  data: TrendPoint[];
  color?: string;
  format?: keyof typeof VALUE_FORMATTERS;
  action?: React.ReactNode;
  emptyLabel?: string;
}) {
  const hasData = data.some((point) => point.value > 0);
  const formatValue = VALUE_FORMATTERS[format];

  const chartConfig = {
    value: { label: title, color },
  } satisfies ChartConfig;

  return (
    <Panel title={title} sub={sub} className="flex-1 p-5" action={action}>
      {!hasData ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-[180px] w-full"
          initialDimension={{ width: 480, height: 180 }}
        >
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
              content={
                <ChartTooltipContent
                  hideLabel={false}
                  formatter={(value) => formatValue(Number(value))}
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[6, 6, 3, 3]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}
