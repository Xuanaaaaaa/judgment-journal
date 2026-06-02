"use client";

import { BarChart3, LineChart as LineChartIcon, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import type {
  BrierPoint,
  CalibrationBucket,
  DomainAccuracy,
} from "@/lib/calibration";

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

// 校准曲线：横轴=置信度桶中点，纵轴=该桶实际准确率，叠加 45° 完美校准参考线。
export function CalibrationChart({ buckets }: { buckets: CalibrationBucket[] }) {
  const data = buckets
    .filter((b) => b.total > 0 && b.accuracy != null && b.meanConfidence != null)
    .map((b) => ({
      mid: b.meanConfidence as number, // 桶内平均置信度，而非桶中点
      accuracy: (b.accuracy as number) * 100,
      label: b.label,
      total: b.total,
    }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="还没有已验证的预测"
        description="记录并验证一些预测，这里会画出你的校准曲线。"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          dataKey="mid"
          domain={[50, 100]}
          ticks={[50, 60, 70, 80, 90, 100]}
          tickFormatter={(v) => `${v}%`}
          {...AXIS_PROPS}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          {...AXIS_PROPS}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [`${Math.round(Number(v))}%`, "实际准确率"]}
          labelFormatter={(v) => `置信度 ~${v}%`}
        />
        <ReferenceLine
          segment={[
            { x: 50, y: 50 },
            { x: 100, y: 100 },
          ]}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 各领域准确率柱状图。
export function DomainChart({ domains }: { domains: DomainAccuracy[] }) {
  if (domains.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="暂无领域数据"
        description="给判断打领域标签后，这里会按领域分组统计准确率。"
      />
    );
  }
  const data = domains.map((d) => ({
    domain: d.domain,
    accuracy: d.accuracy * 100,
    total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          {...AXIS_PROPS}
        />
        <YAxis type="category" dataKey="domain" width={80} {...AXIS_PROPS} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, _n, p) => [
            `${Math.round(Number(v))}%（${p.payload.total} 条）`,
            "准确率",
          ]}
        />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} className="fill-foreground" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Brier 累计趋势：横轴=第几次验证，纵轴=累计平均 Brier（越低越准）。
export function BrierTrendChart({ data }: { data: BrierPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="暂无 Brier 趋势"
        description="验证更多预测，曲线会逐渐稳定。"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          dataKey="seq"
          domain={[1, "dataMax"]}
          allowDecimals={false}
          {...AXIS_PROPS}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          {...AXIS_PROPS}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [Number(v).toFixed(3), "累计 Brier"]}
          labelFormatter={(seq, payload) =>
            `第 ${seq} 次验证${payload?.[0] ? ` · ${payload[0].payload.date}` : ""}`
          }
        />
        <Line
          type="monotone"
          dataKey="brier"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

