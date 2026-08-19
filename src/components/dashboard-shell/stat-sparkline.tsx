"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function StatSparkline({ trend, color, gradientId }: { trend: number[]; color: string; gradientId: string }) {
  return (
    <div className="h-9 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 80, height: 36 }}>
        <AreaChart data={trend.map((v, i) => ({ i, v }))}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
