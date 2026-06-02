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

// recharts 默认 tooltip/axis 是白底黑字，深色模式破裂；走 token 化为主题适配。
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: 12,
    padding: "6px 10px",
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--popover-foreground)" },
  itemStyle: { color: "var(--popover-foreground)" },
  cursor: { stroke: "var(--border)" },
} as const;

const AXIS_PROPS = {
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  axisLine: { stroke: "var(--border)" },
  tickLine: { stroke: "var(--border)" },
} as const;

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
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          {...AXIS_PROPS}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Number(v)}`, "置信度"]} />
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
