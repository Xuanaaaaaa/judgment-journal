import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getJudgment,
  getReviewLogs,
  getVerificationLogs,
} from "@/lib/judgments";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";

import { JudgmentActions } from "./judgment-actions";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function fmt(d: Date) {
  return d.toLocaleString("zh-CN", { hour12: false });
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

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
        ← 返回判断库
      </Link>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-0.5">
            {TYPE_LABEL[judgment.type] ?? judgment.type}
          </span>
          <span className="rounded bg-muted px-2 py-0.5">
            {STATUS_LABEL[judgment.status] ?? judgment.status}
          </span>
          {judgment.domain.map((d) => (
            <span key={d} className="rounded bg-muted px-2 py-0.5">
              {d}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-semibold">{judgment.title}</h1>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <Field
          label="置信度"
          value={judgment.confidence != null ? `${judgment.confidence}` : null}
        />
        {isPrediction ? (
          <Field label="验证截止日期" value={judgment.deadline} />
        ) : (
          <>
            <Field
              label="复审周期（天）"
              value={judgment.reviewIntervalDays?.toString()}
            />
            <Field label="下次复审日期" value={judgment.nextReviewDate} />
          </>
        )}
        <Field label="记录于" value={fmt(judgment.createdAt)} />
      </dl>

      <dl className="space-y-4 text-sm">
        <Field label="理由" value={judgment.reasoning} />
        <Field label="事前验尸" value={judgment.preMortem} />
        <Field label="复盘/结论" value={judgment.resolutionNotes} />
        <Field label="原始输入" value={judgment.rawInput} />
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
          <ul className="space-y-3 text-sm">
            {verifications.map((v) => (
              <li key={v.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{v.result === "correct" ? "正确" : "错误"}</span>
                  <span>{fmt(v.createdAt)}</span>
                </div>
                {v.notes && <p className="whitespace-pre-wrap">{v.notes}</p>}
                {v.evidenceSource && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    依据：{v.evidenceSource}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium">复审记录</h2>
          <ul className="space-y-3 text-sm">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    置信度 {r.previousConfidence ?? "—"} → {r.newConfidence ?? "—"}
                  </span>
                  <span>{fmt(r.createdAt)}</span>
                </div>
                {r.notes && <p className="whitespace-pre-wrap">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
