"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { typeBadgeVariant } from "@/lib/badge-variants";
import { TYPE_LABEL } from "@/lib/labels";

import { parseJudgmentAction, type CreateSuccess } from "./actions";
import { JudgmentForm, type JudgmentFormValues } from "./judgment-form";

const BLANK: JudgmentFormValues = {
  type: "prediction",
  title: "",
  reasoning: "",
  preMortem: "",
  domain: "",
  deadline: "",
  reviewIntervalDays: "",
};

export function EntryView() {
  const [rawText, setRawText] = useState("");
  const [parsing, startParse] = useTransition();
  const [form, setForm] = useState<{
    initial: JudgmentFormValues;
    rawInput: string;
  } | null>(null);
  const [saved, setSaved] = useState<CreateSuccess | null>(null);

  function handleParse() {
    if (!rawText.trim() || parsing) return;
    setSaved(null);
    startParse(async () => {
      const result = await parseJudgmentAction(rawText);
      if (!result.ok) {
        toast.error("解析失败", { description: result.message });
        return;
      }
      const d = result.data;
      setForm({
        rawInput: rawText,
        initial: {
          type: d.type,
          title: d.title,
          reasoning: d.reasoning ?? "",
          preMortem: d.preMortem ?? "",
          domain: d.domain.join(", "),
          deadline: d.deadline ?? "",
          reviewIntervalDays: d.reviewIntervalDays?.toString() ?? "",
        },
      });
    });
  }

  function openManual() {
    setSaved(null);
    setForm({ initial: BLANK, rawInput: "" });
  }

  function reset() {
    setForm(null);
    setRawText("");
  }

  if (form) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>确认并记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JudgmentForm
            key={form.rawInput || "manual"}
            initial={form.initial}
            rawInput={form.rawInput}
            onCreated={(result) => {
              setForm(null);
              setRawText("");
              setSaved(result);
              toast.success("已记录");
            }}
          />
          <Button variant="ghost" size="sm" onClick={reset}>
            <ArrowLeft className="h-3.5 w-3.5" />
            重新输入
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canSubmit = rawText.trim().length > 0 && !parsing;

  return (
    <div className="space-y-4">
      {saved && <SavedNotice result={saved} />}

      {/* Claude 风格 composer：大圆角 + 软阴影 + focus 整框高亮 + 底部工具栏 */}
      <div
        className="group/composer rounded-3xl bg-card shadow-sm ring-1 ring-foreground/10 transition-shadow focus-within:ring-2 focus-within:ring-primary/45"
      >
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleParse();
            }
          }}
          rows={3}
          placeholder="写下你的判断，例如：我认为英伟达股价今年底会突破 200 美元，因为 AI 算力需求还在猛涨。"
          className="min-h-24 resize-none border-0 bg-transparent px-5 pt-4 pb-1 text-[0.95rem] leading-relaxed shadow-none ring-0 outline-none focus-visible:border-0 focus-visible:ring-0 md:text-[0.95rem] dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={openManual}
            disabled={parsing}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            手动填写
          </Button>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ⌘
              </kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>
              <span className="ml-1.5">解析</span>
            </span>
            <Button
              onClick={handleParse}
              disabled={!canSubmit}
              size="icon-lg"
              aria-label="AI 解析"
              className="rounded-full"
            >
              {parsing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedNotice({ result }: { result: CreateSuccess }) {
  // 录入后自动滚到顶部，确保提示能看见
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm">已记录</p>
          <Link
            href={`/judgment/${result.id}`}
            className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
          >
            查看详情
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {result.related.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">相关的历史判断</p>
            {result.relationSummary && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {result.relationSummary}
              </p>
            )}
            <ul className="space-y-1.5">
              {result.related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/judgment/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:border-foreground/40 hover:bg-accent"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant={typeBadgeVariant(r.type)}>
                        {TYPE_LABEL[r.type] ?? r.type}
                      </Badge>
                      <span className="truncate">{r.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.confidence != null && `置信度 ${r.confidence} · `}
                      相似 {Math.round(r.similarity * 100)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

