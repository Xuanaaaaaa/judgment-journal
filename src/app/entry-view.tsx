"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
  const [parseError, setParseError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    initial: JudgmentFormValues;
    rawInput: string;
  } | null>(null);
  const [saved, setSaved] = useState<CreateSuccess | null>(null);

  function handleParse() {
    setParseError(null);
    setSaved(null);
    startParse(async () => {
      const result = await parseJudgmentAction(rawText);
      if (!result.ok) {
        setParseError(result.message);
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
    setParseError(null);
    setSaved(null);
    setForm({ initial: BLANK, rawInput: "" });
  }

  function reset() {
    setForm(null);
    setRawText("");
    setParseError(null);
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
            }}
          />
          <Button variant="ghost" size="sm" onClick={reset}>
            ← 重新输入
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
      {parseError && <p className="text-sm text-destructive">{parseError}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={handleParse} disabled={parsing || !rawText.trim()}>
          {parsing ? "解析中…" : "AI 解析"}
        </Button>
        <Button variant="outline" onClick={openManual}>
          手动填写
        </Button>
      </div>
    </div>
  );
}

// 录入成功后的提示：已记录 + 关联到的历史判断（含 AI 一句话总结）。
function SavedNotice({ result }: { result: CreateSuccess }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm text-foreground">
          已记录。
          <Link href={`/judgment/${result.id}`} className="ml-1 underline">
            查看详情
          </Link>
        </p>

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
                    className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="truncate">{r.title}</span>
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
