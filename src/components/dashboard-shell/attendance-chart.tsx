"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Panel } from "./panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type AttendanceChartRow = {
  id: string;
  name: string;
  percentPresent: number | null;
};

function toneForPercent(percent: number) {
  if (percent >= 75) return "var(--color-success)";
  if (percent >= 50) return "var(--color-warning)";
  return "var(--color-destructive)";
}

const chartConfig = {
  value: { label: "Attendance" },
} satisfies ChartConfig;

export function AttendanceChart({
  title,
  sub,
  rows,
}: {
  title: string;
  sub: string;
  rows: AttendanceChartRow[];
}) {
  const data = rows.map((row) => ({
    ...row,
    value: Math.max(row.percentPresent ?? 0, row.percentPresent === 0 ? 0.5 : 0),
  }));

  return (
    <Panel title={title} sub={sub} className="flex-1 p-5">
      {rows.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">No attendance recorded yet.</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto w-full"
          style={{ height: Math.max(rows.length * 34, 140) }}
          initialDimension={{ width: 480, height: Math.max(rows.length * 34, 140) }}
        >
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--color-chart-axis)" }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-muted)" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(_value, _name, item) => {
                    const row = item.payload as { name: string; percentPresent: number | null };
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">{row.name}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {row.percentPresent === null ? "No data" : `${row.percentPresent}%`}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={10} isAnimationActive={false}>
              {data.map((row) => (
                <Cell key={row.id} fill={toneForPercent(row.percentPresent ?? 0)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}
