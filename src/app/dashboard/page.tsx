import Link from "next/link";

import { getDashboardData } from "@/lib/calibration";
import { expireStalePredictions } from "@/lib/judgments";

import { BrierTrendChart, CalibrationChart, DomainChart } from "./charts";

// 读实时 DB 数据，禁止构建时静态预渲染。
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await expireStalePredictions(); // 延惰到期扫描，必须在统计待处理/校准前执行
  const { buckets, domains, pending, verifiedCount, brierTrend } =
    await getDashboardData();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold">仪表盘</h1>

      <section className="grid grid-cols-2 gap-4">
        <Link
          href="/library?type=prediction&status=pending&due=1"
          className="rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <div className="text-3xl font-semibold">{pending.duePredictions}</div>
          <div className="mt-1 text-sm text-muted-foreground">待验证的预测</div>
        </Link>
        <Link
          href="/library?type=stance&status=active&due=1"
          className="rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <div className="text-3xl font-semibold">{pending.dueStances}</div>
          <div className="mt-1 text-sm text-muted-foreground">待复审的立场</div>
        </Link>
      </section>

      <section>
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-medium">校准曲线</h2>
          <span className="text-xs text-muted-foreground">
            样本 {verifiedCount} 条
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          点在对角线上方=偏保守，下方=过度自信。
        </p>
        <CalibrationChart buckets={buckets} />
      </section>

      <section>
        <h2 className="mb-3 font-medium">各领域准确率</h2>
        <DomainChart domains={domains} />
      </section>

      <section>
        <h2 className="mb-1 font-medium">Brier 趋势</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          累计平均 Brier 分，越低越准；下降说明校准在变好。
        </p>
        <BrierTrendChart data={brierTrend} />
      </section>
    </main>
  );
}
