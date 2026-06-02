import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Gauge,
  Lightbulb,
  MessageSquare,
  Repeat,
  RotateCw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  statusBadgeVariant,
  typeBadgeVariant,
} from "@/lib/badge-variants";
import {
  getJudgment,
  getReviewLogs,
  getVerificationLogs,
} from "@/lib/judgments";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";

import { JudgmentActions } from "./judgment-actions";
import { StanceTimelineChart } from "./timeline-chart";

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="whitespace-pre-wrap text-sm">{value}</dd>
    </div>
  );
}

function fmt(d: Date) {
  return d.toLocaleString("zh-CN", { hour12: false });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("zh-CN");
}

const RTF = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });
function relativeTime(d: Date) {
  const diffMs = d.getTime() - Date.now();
  const absSec = Math.abs(diffMs) / 1000;
  if (absSec < 60) return RTF.format(Math.round(diffMs / 1000), "second");
  if (absSec < 3600) return RTF.format(Math.round(diffMs / 60_000), "minute");
  if (absSec < 86400) return RTF.format(Math.round(diffMs / 3_600_000), "hour");
  if (absSec < 86400 * 30)
    return RTF.format(Math.round(diffMs / 86_400_000), "day");
  if (absSec < 86400 * 365)
    return RTF.format(Math.round(diffMs / (86_400_000 * 30)), "month");
  return RTF.format(Math.round(diffMs / (86_400_000 * 365)), "year");
}

function TimeWithTooltip({ date }: { date: Date }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-default text-xs text-muted-foreground">
            {relativeTime(date)}
          </span>
        }
      />
      <TooltipContent>{fmt(date)}</TooltipContent>
    </Tooltip>
  );
}

function buildTimeline(
  createdAt: Date,
  reviews: {
    previousConfidence: number | null;
    newConfidence: number | null;
    createdAt: Date;
  }[],
): { label: string; confidence: number }[] {
  const asc = [...reviews].reverse();
  const start = asc[0]?.previousConfidence ?? null;
  const points: { label: string; confidence: number }[] = [];
  if (start != null) {
    points.push({ label: fmtDate(createdAt), confidence: start });
  }
  for (const r of asc) {
    if (r.newConfidence != null) {
      points.push({ label: fmtDate(r.createdAt), confidence: r.newConfidence });
    }
  }
  return points;
}

type Params = Promise<{ id: string }>;

export default async function JudgmentDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const judgment = await getJudgment(id);
  if (!judgment) notFound();

  const isPrediction = judgment.type === "prediction";
  const [verifications, reviews] = await Promise.all([
    isPrediction ? getVerificationLogs(id) : Promise.resolve([]),
    isPrediction ? Promise.resolve([]) : getReviewLogs(id),
  ]);

  const timeline = isPrediction
    ? []
    : buildTimeline(judgment.createdAt, reviews);

  return (
    <TooltipProvider delay={200}>
      <main className="mx-auto w-full max-w-2xl space-y-6 px-6 py-10">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回判断库
        </Link>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Badge variant={typeBadgeVariant(judgment.type)}>
              {TYPE_LABEL[judgment.type] ?? judgment.type}
            </Badge>
            <Badge variant={statusBadgeVariant(judgment.status)}>
              {STATUS_LABEL[judgment.status] ?? judgment.status}
            </Badge>
            {judgment.domain.map((d) => (
              <Badge key={d} variant="outline">
                {d}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {judgment.title}
          </h1>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Field
            icon={Gauge}
            label="置信度"
            value={judgment.confidence != null ? `${judgment.confidence}` : null}
          />
          {isPrediction ? (
            <Field
              icon={Calendar}
              label="验证截止日期"
              value={judgment.deadline}
            />
          ) : (
            <>
              <Field
                icon={Repeat}
                label="复审周期（天）"
                value={judgment.reviewIntervalDays?.toString()}
              />
              <Field
                icon={Calendar}
                label="下次复审日期"
                value={judgment.nextReviewDate}
              />
            </>
          )}
          <Field icon={Calendar} label="记录于" value={fmt(judgment.createdAt)} />
        </dl>

        <dl className="space-y-5">
          <Field icon={Lightbulb} label="理由" value={judgment.reasoning} />
          <Field
            icon={AlertTriangle}
            label="事前验尸"
            value={judgment.preMortem}
          />
          <Field
            icon={MessageSquare}
            label="复盘/结论"
            value={judgment.resolutionNotes}
          />
          <Field
            icon={FileText}
            label="原始输入"
            value={judgment.rawInput}
          />
        </dl>

        <JudgmentActions
          id={judgment.id}
          type={judgment.type}
          status={judgment.status}
          confidence={judgment.confidence}
        />

        {verifications.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium">验证记录</h2>
            <ul className="space-y-2.5">
              {verifications.map((v) => {
                const correct = v.result === "correct";
                return (
                  <li key={v.id}>
                    <Card>
                      <CardContent className="p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            {correct ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                            )}
                            {correct ? "正确" : "错误"}
                          </span>
                          <TimeWithTooltip date={v.createdAt} />
                        </div>
                        {v.notes && (
                          <p className="whitespace-pre-wrap">{v.notes}</p>
                        )}
                        {v.evidenceSource && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            依据：{v.evidenceSource}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {timeline.length >= 2 && (
          <section>
            <h2 className="mb-3 text-sm font-medium">置信度时间线</h2>
            <StanceTimelineChart data={timeline} />
          </section>
        )}

        {reviews.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium">复审记录</h2>
            <ul className="space-y-2.5">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardContent className="p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
                          置信度 {r.previousConfidence ?? "—"} →{" "}
                          <span className="font-medium text-foreground">
                            {r.newConfidence ?? "—"}
                          </span>
                        </span>
                        <TimeWithTooltip date={r.createdAt} />
                      </div>
                      {r.notes && (
                        <p className="whitespace-pre-wrap">{r.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </TooltipProvider>
  );
}
