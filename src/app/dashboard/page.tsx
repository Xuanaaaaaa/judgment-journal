import { CheckSquare, RotateCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/calibration";
import { expireStalePredictions } from "@/lib/judgments";

import { BrierTrendChart, CalibrationChart, DomainChart } from "./charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await expireStalePredictions();
  const { buckets, domains, pending, verifiedCount, brierTrend } =
    await getDashboardData();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <PageHeader title="仪表盘" description="你的判断质量在向哪边走？" />

      <section className="grid grid-cols-2 gap-4">
        <StatCard
          label="待验证的预测"
          value={pending.duePredictions}
          icon={CheckSquare}
          href="/library?type=prediction&status=pending&due=1"
          hint={pending.duePredictions > 0 ? "点击查看清单" : "暂无到期项"}
        />
        <StatCard
          label="待复审的立场"
          value={pending.dueStances}
          icon={RotateCw}
          href="/library?type=stance&status=active&due=1"
          hint={pending.dueStances > 0 ? "点击查看清单" : "暂无到期项"}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between">
            <CardTitle>校准曲线</CardTitle>
            <span className="text-xs text-muted-foreground">
              样本 {verifiedCount} 条
            </span>
          </div>
          <CardDescription>
            点在对角线上方 = 偏保守；下方 = 过度自信。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalibrationChart buckets={buckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>各领域准确率</CardTitle>
          <CardDescription>按你的领域标签分组统计。</CardDescription>
        </CardHeader>
        <CardContent>
          <DomainChart domains={domains} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brier 趋势</CardTitle>
          <CardDescription>
            累计平均 Brier 分，越低越准；下降说明校准在变好。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrierTrendChart data={brierTrend} />
        </CardContent>
      </Card>
    </main>
  );
}
