"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  saveSettingsAction,
  testConnectionAction,
  testEmbeddingConnectionAction,
  type ActionResult,
} from "./actions";

type Props = {
  initial: {
    provider: string;
    baseUrl: string;
    model: string;
    embeddingBaseUrl: string;
    embeddingModel: string;
    defaultReviewIntervalDays: number;
  };
  hasApiKey: boolean;
  hasEmbeddingApiKey: boolean;
};

function ConfigBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge variant="outline" className="gap-1 text-foreground">
      <CheckCircle2 className="h-3 w-3" />
      已配置
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      未配置
    </Badge>
  );
}

function PasswordInput({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "隐藏" : "显示"}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function SettingsForm({ initial, hasApiKey, hasEmbeddingApiKey }: Props) {
  const [saveState, saveFormAction, saving] = useActionState<
    ActionResult,
    FormData
  >(saveSettingsAction, null);
  const [provider, setProvider] = useState(initial.provider);
  const [testing, startTest] = useTransition();
  const [embTesting, startEmbTest] = useTransition();

  useEffect(() => {
    if (!saveState) return;
    if (saveState.ok) toast.success("已保存", { description: saveState.message });
    else toast.error("保存失败", { description: saveState.message });
  }, [saveState]);

  function runTest() {
    startTest(async () => {
      const r = await testConnectionAction();
      if (r?.ok) toast.success("连接成功", { description: r.message });
      else toast.error("连接失败", { description: r?.message ?? "未知错误" });
    });
  }

  function runEmbTest() {
    startEmbTest(async () => {
      const r = await testEmbeddingConnectionAction();
      if (r?.ok) toast.success("Embedding 连通", { description: r.message });
      else toast.error("Embedding 失败", { description: r?.message ?? "未知错误" });
    });
  }

  return (
    <form action={saveFormAction} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>对话模型</CardTitle>
              <CardDescription>
                用于自然语言解析、关系总结等。当前仅接入 OpenAI 兼容厂商。
              </CardDescription>
            </div>
            <ConfigBadge configured={hasApiKey} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <input type="hidden" name="provider" value={provider} />
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v ?? "openai-compatible")}
            >
              <SelectTrigger id="provider" className="w-full">
                <SelectValue>
                  {(v) =>
                    v === "openai-compatible"
                      ? "OpenAI 兼容（DeepSeek 等）"
                      : (v as string)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai-compatible">
                  OpenAI 兼容（DeepSeek 等）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                defaultValue={initial.baseUrl}
                placeholder="https://api.deepseek.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                name="model"
                defaultValue={initial.model}
                placeholder="deepseek-v4-flash"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <PasswordInput
              id="apiKey"
              name="apiKey"
              placeholder={hasApiKey ? "已保存（留空则不修改）" : "填写 API Key"}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              测试使用已保存的配置，请先保存再测试。
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runTest}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              测试连接
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Embedding 模型</CardTitle>
              <CardDescription>
                用于关联检索和语义搜索的向量生成，独立于对话模型。
                一经选定不要随意更换——换模型需重新生成全部历史向量。
              </CardDescription>
            </div>
            <ConfigBadge configured={hasEmbeddingApiKey} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="embeddingBaseUrl">Base URL</Label>
              <Input
                id="embeddingBaseUrl"
                name="embeddingBaseUrl"
                defaultValue={initial.embeddingBaseUrl}
                placeholder="https://api.siliconflow.cn/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embeddingModel">模型</Label>
              <Input
                id="embeddingModel"
                name="embeddingModel"
                defaultValue={initial.embeddingModel}
                placeholder="Qwen/Qwen3-Embedding-8B"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embeddingApiKey">API Key</Label>
            <PasswordInput
              id="embeddingApiKey"
              name="embeddingApiKey"
              placeholder={
                hasEmbeddingApiKey ? "已保存（留空则不修改）" : "填写 API Key"
              }
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              测试会消耗一次 embedding 调用（短文本）。
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runEmbTest}
              disabled={embTesting}
            >
              {embTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              测试 Embedding
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>偏好</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultReviewIntervalDays">
              默认复审周期（天）
            </Label>
            <Input
              id="defaultReviewIntervalDays"
              name="defaultReviewIntervalDays"
              type="number"
              min={1}
              defaultValue={initial.defaultReviewIntervalDays}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">
              新建认知立场时默认填入此值，可在录入时单独调整。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>数据导出</CardTitle>
          <CardDescription>
            导出全部判断及复审/验证记录为 JSON（不含 API Key 与向量）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/api/export" download />}
          >
            <Download className="h-3.5 w-3.5" />
            导出数据（JSON）
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-lg border bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "保存中…" : "保存设置"}
        </Button>
      </div>
    </form>
  );
}
