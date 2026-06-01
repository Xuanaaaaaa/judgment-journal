"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  abandonStanceAction,
  reviewStanceAction,
  verifyPredictionAction,
  type ActionResult,
} from "./actions";

type Props = {
  id: string;
  type: string;
  status: string;
  confidence: number | null;
};

function Message({ state }: { state: ActionResult }) {
  if (!state) return null;
  return (
    <p className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"}>
      {state.message}
    </p>
  );
}

export function JudgmentActions({ id, type, status, confidence }: Props) {
  const [verifyState, verifyAction, verifying] = useActionState<
    ActionResult,
    FormData
  >(verifyPredictionAction, null);
  const [reviewState, reviewAction, reviewing] = useActionState<
    ActionResult,
    FormData
  >(reviewStanceAction, null);
  const [abandonState, abandonAction, abandoning] = useActionState<
    ActionResult,
    FormData
  >(abandonStanceAction, null);

  if (type === "prediction" && status === "pending") {
    return (
      <form action={verifyAction} className="space-y-4 rounded-lg border p-4">
        <h2 className="font-medium">验证这条预测</h2>
        <input type="hidden" name="id" value={id} />
        <div className="space-y-2">
          <Label htmlFor="notes">复盘笔记</Label>
          <Textarea id="notes" name="notes" rows={3} placeholder="结果如何？当初的理由站得住吗？" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidenceSource">验证依据来源（可选）</Label>
          <Input id="evidenceSource" name="evidenceSource" placeholder="链接或出处" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" name="result" value="correct" disabled={verifying}>
            标记正确
          </Button>
          <Button
            type="submit"
            name="result"
            value="wrong"
            variant="outline"
            disabled={verifying}
          >
            标记错误
          </Button>
        </div>
        <Message state={verifyState} />
      </form>
    );
  }

  if (type === "stance" && status === "active") {
    return (
      <div className="space-y-4">
        <form action={reviewAction} className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">复审这条立场</h2>
          <p className="text-sm text-muted-foreground">
            当前置信度：{confidence ?? "未填"}
          </p>
          <input type="hidden" name="id" value={id} />
          <div className="space-y-2">
            <Label htmlFor="newConfidence">新的置信度（0–100）</Label>
            <Input
              id="newConfidence"
              name="newConfidence"
              type="number"
              min={0}
              max={100}
              defaultValue={confidence ?? undefined}
              className="w-32"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">本次复审的思考</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="有什么新信息让你改变或坚定看法？" />
          </div>
          <Button type="submit" disabled={reviewing}>
            记录复审
          </Button>
          <Message state={reviewState} />
        </form>

        <form action={abandonAction} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-medium">放弃这条立场</h2>
          <input type="hidden" name="id" value={id} />
          <div className="space-y-2">
            <Label htmlFor="abandonNotes">放弃原因（可选）</Label>
            <Textarea id="abandonNotes" name="notes" rows={2} />
          </div>
          <Button type="submit" variant="outline" disabled={abandoning}>
            标记放弃
          </Button>
          <Message state={abandonState} />
        </form>
      </div>
    );
  }

  return null;
}
