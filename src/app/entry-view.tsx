"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Pencil, Sparkles } from "lucide-react";
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

  return (
    <div className="space-y-4">
      {saved && <SavedNotice result={saved} />}
      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        rows={5}
        placeholder="用一句话或一段话写下你的判断，例如：我认为英伟达股价今年底会突破 200 美元，因为 AI 算力需求还在猛涨。"
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleParse} disabled={parsing || !rawText.trim()}>
          <Sparkles className="h-4 w-4" />
          {parsing ? "解析中…" : "AI 解析"}
        </Button>
        <Button variant="outline" onClick={openManual}>
          <Pencil className="h-4 w-4" />
          手动填写
        </Button>
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
