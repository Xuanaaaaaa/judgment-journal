"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createJudgmentAction, type CreateResult } from "./actions";

export type JudgmentFormValues = {
  type: "prediction" | "stance";
  title: string;
  reasoning: string;
  preMortem: string;
  domain: string;
  deadline: string;
  reviewIntervalDays: string;
};

type Props = {
  initial: JudgmentFormValues;
  rawInput: string;
  onCreated: () => void;
};

export function JudgmentForm({ initial, rawInput, onCreated }: Props) {
  const [state, formAction, pending] = useActionState<CreateResult, FormData>(
    createJudgmentAction,
    null,
  );
  const [type, setType] = useState(initial.type);

  useEffect(() => {
    if (state?.ok) onCreated();
  }, [state, onCreated]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rawInput" value={rawInput} />
      <input type="hidden" name="type" value={type} />

      <div className="space-y-2">
        <Label htmlFor="type">类型</Label>
        <Select
          value={type}
          onValueChange={(v) =>
            setType(v === "stance" ? "stance" : "prediction")
          }
        >
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prediction">预测（有截止日，可验证对错）</SelectItem>
            <SelectItem value="stance">认知立场（持续看法，定期复审）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">命题</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial.title}
          placeholder="一句话、可验证的判断"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reasoning">理由</Label>
        <Textarea
          id="reasoning"
          name="reasoning"
          defaultValue={initial.reasoning}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preMortem">事前验尸</Label>
        <Textarea
          id="preMortem"
          name="preMortem"
          defaultValue={initial.preMortem}
          rows={2}
          placeholder="如果我错了，最可能因为什么？"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="confidence">置信度（0–100）</Label>
          <Input
            id="confidence"
            name="confidence"
            type="number"
            min={0}
            max={100}
            placeholder="你自己的判断，AI 不代填"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">领域标签</Label>
          <Input
            id="domain"
            name="domain"
            defaultValue={initial.domain}
            placeholder="逗号分隔，如：投资, 科技"
          />
        </div>
      </div>

      {type === "prediction" ? (
        <div className="space-y-2">
          <Label htmlFor="deadline">验证截止日期</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={initial.deadline}
            className="w-48"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="reviewIntervalDays">复审周期（天）</Label>
          <Input
            id="reviewIntervalDays"
            name="reviewIntervalDays"
            type="number"
            min={1}
            defaultValue={initial.reviewIntervalDays || "90"}
            className="w-32"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : "记录判断"}
        </Button>
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.message}</span>
        )}
      </div>
    </form>
  );
}
