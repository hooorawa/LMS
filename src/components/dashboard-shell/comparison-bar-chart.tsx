"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Panel } from "./panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ComparisonPoint = {
  key: string;
  label: string;
  value: number;
};

const chartConfig = {
  value: { label: "Value", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function ComparisonBarChart({
  title,
  sub,
  data,
  referenceValue,
  referenceLabel,
  format = "number",
  emptyLabel = "No data yet.",
  className,
}: {
  title: string;
  sub: string;
  data: ComparisonPoint[];
  referenceValue?: number;
  referenceLabel?: string;
  format?: "number" | "percent" | "currency";
  emptyLabel?: string;
  className?: string;
}) {
  const hasData = data.length > 0;
  const formatValue = (value: number) =>
    format === "percent" ? `${value.toFixed(1)}%` : format === "currency" ? `$${value.toFixed(2)}` : value.toLocaleString();

  return (
    <Panel title={title} sub={sub} className={cn("flex-1 p-5", className)}>
      {!hasData ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-[220px] w-full"
          initialDimension={{ width: 560, height: 220 }}
        >
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11.5, fill: "var(--color-chart-axis)" }}
              interval={0}
              angle={data.length > 6 ? -20 : 0}
              textAnchor={data.length > 6 ? "end" : "middle"}
              height={data.length > 6 ? 48 : 24}
            />
            <YAxis hide domain={[0, "auto"]} />
            <ChartTooltip
              cursor={{ fill: "var(--color-muted)" }}
              content={<ChartTooltipContent hideLabel={false} formatter={(value) => formatValue(Number(value))} />}
            />
            {referenceValue != null ? (
              <ReferenceLine
                y={referenceValue}
                stroke="var(--color-chart-axis)"
                strokeDasharray="4 4"
                label={{
                  value: referenceLabel ?? formatValue(referenceValue),
                  position: "insideTopRight",
                  fill: "var(--color-muted-foreground)",
                  fontSize: 11,
                }}
              />
            ) : null}
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 3, 3]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}
