"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 认知立场复审时间线：置信度随每次复审的变化。
export function StanceTimelineChart({
  data,
}: {
  data: { label: string; confidence: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          fontSize={12}
        />
        <Tooltip formatter={(v) => [`${Number(v)}`, "置信度"]} />
        <Line
          type="monotone"
          dataKey="confidence"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
