"use client";

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

import type { CalibrationBucket, DomainAccuracy } from "@/lib/calibration";

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
    return <Empty>暂无已验证的预测，记录并验证一些预测后这里会显示校准曲线。</Empty>;
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
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          fontSize={12}
        />
        <Tooltip
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
    return <Empty>暂无领域数据。</Empty>;
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
          fontSize={12}
        />
        <YAxis type="category" dataKey="domain" width={80} fontSize={12} />
        <Tooltip
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">{children}</p>
  );
}
