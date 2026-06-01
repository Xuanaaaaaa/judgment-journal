"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { parseJudgmentAction } from "./actions";
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
  const [saved, setSaved] = useState(false);

  function handleParse() {
    setParseError(null);
    setSaved(false);
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
    setSaved(false);
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
            onCreated={() => {
              setForm(null);
              setRawText("");
              setSaved(true);
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
      {saved && (
        <p className="text-sm text-foreground">已记录。可以继续录入下一条。</p>
      )}
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
