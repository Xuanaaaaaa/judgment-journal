"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Lightbulb,
  Loader2,
  Repeat,
  Save,
  Tag,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  createJudgmentAction,
  type CreateResult,
  type CreateSuccess,
} from "./actions";

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
  onCreated: (result: CreateSuccess) => void;
};

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </Label>
  );
}

export function JudgmentForm({ initial, rawInput, onCreated }: Props) {
  const [state, formAction, pending] = useActionState<CreateResult, FormData>(
    createJudgmentAction,
    null,
  );
  const [type, setType] = useState(initial.type);

  useEffect(() => {
    if (state?.ok) onCreated(state);
    else if (state && !state.ok) {
      toast.error("保存失败", { description: state.message });
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rawInput" value={rawInput} />
      <input type="hidden" name="type" value={type} />

      <Tabs
        value={type}
        onValueChange={(v) =>
          setType(v === "stance" ? "stance" : "prediction")
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prediction">预测（有截止日）</TabsTrigger>
          <TabsTrigger value="stance">认知立场（定期复审）</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <FieldLabel htmlFor="title" icon={Target}>
          命题
        </FieldLabel>
        <Input
          id="title"
          name="title"
          defaultValue={initial.title}
          placeholder="一句话、可验证的判断"
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reasoning" icon={Lightbulb}>
          理由
        </FieldLabel>
        <Textarea
          id="reasoning"
          name="reasoning"
          defaultValue={initial.reasoning}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="preMortem" icon={AlertTriangle}>
          事前验尸
        </FieldLabel>
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
          <FieldLabel htmlFor="domain" icon={Tag}>
            领域标签
          </FieldLabel>
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
          <FieldLabel htmlFor="deadline" icon={Calendar}>
            验证截止日期
          </FieldLabel>
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
          <FieldLabel htmlFor="reviewIntervalDays" icon={Repeat}>
            复审周期（天）
          </FieldLabel>
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

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {pending ? "保存中…" : "记录判断"}
      </Button>
    </form>
  );
}
