"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function JudgmentActions({ id, type, status, confidence }: Props) {
  if (type === "prediction" && status === "pending") {
    return (
      <div className="flex flex-wrap gap-2">
        <VerifyDialog id={id} result="correct" />
        <VerifyDialog id={id} result="wrong" />
      </div>
    );
  }

  if (type === "stance" && status === "active") {
    return (
      <div className="flex flex-wrap gap-2">
        <ReviewDialog id={id} confidence={confidence} />
        <AbandonDialog id={id} />
      </div>
    );
  }

  return null;
}

function useToastFeedback(
  state: ActionResult,
  successText: string,
  onSuccess?: () => void,
) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(successText);
      onSuccess?.();
    } else {
      toast.error("操作失败", { description: state.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

function VerifyDialog({
  id,
  result,
}: {
  id: string;
  result: "correct" | "wrong";
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    verifyPredictionAction,
    null,
  );
  useToastFeedback(state, "已记录验证结果", () => setOpen(false));

  const isCorrect = result === "correct";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={isCorrect ? "default" : "outline"}>
            {isCorrect ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isCorrect ? "标记正确" : "标记错误"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCorrect ? "标记这条预测为「正确」" : "标记这条预测为「错误」"}
          </DialogTitle>
          <DialogDescription>
            写下复盘笔记，过段时间回看更有帮助。
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="result" value={result} />
          <div className="space-y-2">
            <Label htmlFor="notes">复盘笔记</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="结果如何？当初的理由站得住吗？"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidenceSource">验证依据来源（可选）</Label>
            <Input
              id="evidenceSource"
              name="evidenceSource"
              placeholder="链接或出处"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              确认提交
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  id,
  confidence,
}: {
  id: string;
  confidence: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    reviewStanceAction,
    null,
  );
  useToastFeedback(state, "已记录复审", () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <RefreshCw className="h-4 w-4" />
            复审
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>复审这条立场</DialogTitle>
          <DialogDescription>
            当前置信度：{confidence ?? "未填"}。有什么新信息让你改变或坚定看法？
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
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
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              记录复审
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AbandonDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    abandonStanceAction,
    null,
  );
  useToastFeedback(state, "已标记放弃", () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <X className="h-4 w-4" />
            放弃
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>放弃这条立场</DialogTitle>
          <DialogDescription>
            放弃后不再参与复审，但记录会保留。
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <div className="space-y-2">
            <Label htmlFor="abandonNotes">放弃原因（可选）</Label>
            <Textarea id="abandonNotes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              确认放弃
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
