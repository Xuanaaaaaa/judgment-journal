import Link from "next/link";
import {
  Bell,
  Calendar,
  Inbox,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  statusBadgeVariant,
  typeBadgeVariant,
} from "@/lib/badge-variants";
import { generateEmbedding, isEmbeddingConfigured } from "@/lib/embedding";
import {
  expireStalePredictions,
  listDomains,
  listJudgments,
  listPending,
  semanticSearch,
  type JudgmentListItem,
  type RelatedJudgment,
} from "@/lib/judgments";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";

import { Filters } from "./filters";
import { SearchBox } from "./search-box";

function JudgmentRow({ item }: { item: JudgmentListItem }) {
  const dateText =
    item.type === "prediction"
      ? item.deadline && `截止 ${item.deadline}`
      : item.nextReviewDate && `复审 ${item.nextReviewDate}`;

  return (
    <Link
      href={`/judgment/${item.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-medium">{item.title}</span>
        {item.confidence != null && (
          <span className="shrink-0 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {item.confidence}
            </span>
            <span className="ml-0.5 text-xs">% 置信</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={typeBadgeVariant(item.type)}>
          {TYPE_LABEL[item.type] ?? item.type}
        </Badge>
        <Badge variant={statusBadgeVariant(item.status)}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Badge>
        {item.domain.map((d) => (
          <Badge key={d} variant="outline">
            {d}
          </Badge>
        ))}
        {dateText && (
          <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dateText}
          </span>
        )}
      </div>
    </Link>
  );
}

function SearchResultRow({ item }: { item: RelatedJudgment }) {
  return (
    <Link
      href={`/judgment/${item.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-medium">{item.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.confidence != null && `置信度 ${item.confidence} · `}
          相似 {Math.round(item.similarity * 100)}%
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={typeBadgeVariant(item.type)}>
          {TYPE_LABEL[item.type] ?? item.type}
        </Badge>
        <Badge variant={statusBadgeVariant(item.status)}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Badge>
      </div>
    </Link>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  await expireStalePredictions();

  if (q) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <PageHeader title="判断库" description={`搜索：${q}`} />
        <SearchBox key={q} initial={q} />
        <SearchResults q={q} />
      </main>
    );
  }

  const filters = {
    type: first(sp.type),
    status: first(sp.status),
    domain: first(sp.domain),
  };
  const due = first(sp.due) === "1";
  const [pending, items, domains] = await Promise.all([
    listPending(),
    listJudgments({ ...filters, due }),
    listDomains(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <PageHeader
        title="判断库"
        description={`共 ${items.length} 条${pending.length ? ` · 待处理 ${pending.length}` : ""}`}
      />

      <SearchBox initial="" />

      {pending.length > 0 && (
        <section className="mb-8 rounded-xl border border-border bg-accent p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-primary" />
            待处理 · {pending.length}
          </h2>
          <div className="space-y-2.5">
            {pending.map((item) => (
              <JudgmentRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <Filters domains={domains} current={filters} />
        {items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="没有符合条件的判断"
            description="试试清除筛选，或先去录入一条新判断。"
            action={
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/" />}
              >
                去录入
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <JudgmentRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

async function SearchResults({ q: _q }: { q: string }) {
  let configured: boolean;
  let results: RelatedJudgment[] | null = null;
  try {
    configured = await isEmbeddingConfigured();
    if (configured) {
      const vector = await generateEmbedding(_q);
      results = await semanticSearch(vector);
    }
  } catch {
    return (
      <EmptyState
        icon={SearchIcon}
        title="搜索失败"
        description="请稍后重试，或检查 Embedding 配置是否正确。"
      />
    );
  }

  if (!configured) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="语义搜索未配置"
        description="需要在设置里配置 Embedding 模型后才能使用。"
        action={
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/settings" />}
          >
            去设置
          </Button>
        }
      />
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="没有语义相关的判断"
        description="仅能搜到配置 Embedding 之后录入的判断。"
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {results.map((item) => (
        <SearchResultRow key={item.id} item={item} />
      ))}
    </div>
  );
}
