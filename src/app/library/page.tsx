import Link from "next/link";

import {
  expireStalePredictions,
  listDomains,
  listJudgments,
  listPending,
  type JudgmentListItem,
} from "@/lib/judgments";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";

import { Filters } from "./filters";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function JudgmentRow({ item }: { item: JudgmentListItem }) {
  const dateText =
    item.type === "prediction"
      ? item.deadline && `截止 ${item.deadline}`
      : item.nextReviewDate && `复审 ${item.nextReviewDate}`;

  return (
    <Link
      href={`/judgment/${item.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-medium">{item.title}</span>
        {item.confidence != null && (
          <span className="shrink-0 text-sm text-muted-foreground">
            置信度 {item.confidence}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{TYPE_LABEL[item.type] ?? item.type}</Tag>
        <Tag>{STATUS_LABEL[item.status] ?? item.status}</Tag>
        {item.domain.map((d) => (
          <Tag key={d}>{d}</Tag>
        ))}
        {dateText && (
          <span className="text-xs text-muted-foreground">{dateText}</span>
        )}
      </div>
    </Link>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// query 值可能是数组（如 ?type=a&type=b），统一取首个字符串。
function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters = {
    type: first(sp.type),
    status: first(sp.status),
    domain: first(sp.domain),
  };
  const due = first(sp.due) === "1";
  await expireStalePredictions(); // 延惰到期扫描，必须在读取列表/待处理前执行
  const [pending, items, domains] = await Promise.all([
    listPending(),
    listJudgments({ ...filters, due }),
    listDomains(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">判断库</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-foreground">
            待处理 · {pending.length}
          </h2>
          <div className="space-y-3">
            {pending.map((item) => (
              <JudgmentRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <Filters domains={domains} current={filters} />
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            没有符合条件的判断。
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <JudgmentRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
